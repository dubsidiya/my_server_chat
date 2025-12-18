import pool from '../db.js';

// Парсинг текста отчета для извлечения занятий
// Формат: "Имя ученика - цена" или "Имя: цена" или "Имя цена"
const parseReportContent = (content, reportDate, userId) => {
  const lines = content.split('\n').map(line => line.trim()).filter(line => line);
  const lessons = [];

  for (const line of lines) {
    // Пропускаем пустые строки и строки, которые выглядят как дата
    if (!line || /^\d{1,2}[.\/]\d{1,2}[.\/]\d{2,4}$/.test(line)) {
      continue;
    }

    // Пытаемся найти имя и цену
    // Форматы: "Имя - 2500", "Имя: 2500", "Имя 2500", "Имя - 2500₽"
    const patterns = [
      /^(.+?)\s*[-:]\s*(\d+(?:[.,]\d+)?)\s*₽?$/i,  // "Имя - 2500" или "Имя: 2500₽"
      /^(.+?)\s+(\d+(?:[.,]\d+)?)\s*₽?$/i,          // "Имя 2500"
    ];

    let studentName = null;
    let price = null;

    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        studentName = match[1].trim();
        price = parseFloat(match[2].replace(',', '.'));
        break;
      }
    }

    if (studentName && price && price > 0) {
      lessons.push({ studentName, price });
    }
  }

  return lessons;
};

// Получение всех отчетов пользователя
export const getAllReports = async (req, res) => {
  try {
    const userId = req.user.userId;

    const result = await pool.query(
      `SELECT r.*, COUNT(rl.lesson_id) as lessons_count
       FROM reports r
       LEFT JOIN report_lessons rl ON r.id = rl.report_id
       WHERE r.created_by = $1
       GROUP BY r.id
       ORDER BY r.report_date DESC, r.created_at DESC`,
      [userId]
    );

    res.json(result.rows);
  } catch (error) {
    console.error('Ошибка получения отчетов:', error);
    res.status(500).json({ message: 'Ошибка получения отчетов' });
  }
};

// Получение одного отчета с занятиями
export const getReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Получаем отчет
    const reportResult = await pool.query(
      'SELECT * FROM reports WHERE id = $1 AND created_by = $2',
      [id, userId]
    );

    if (reportResult.rows.length === 0) {
      return res.status(404).json({ message: 'Отчет не найден' });
    }

    const report = reportResult.rows[0];

    // Получаем связанные занятия
    const lessonsResult = await pool.query(
      `SELECT l.*, s.name as student_name
       FROM report_lessons rl
       JOIN lessons l ON rl.lesson_id = l.id
       JOIN students s ON l.student_id = s.id
       WHERE rl.report_id = $1
       ORDER BY l.lesson_date, l.lesson_time`,
      [id]
    );

    report.lessons = lessonsResult.rows;

    res.json(report);
  } catch (error) {
    console.error('Ошибка получения отчета:', error);
    res.status(500).json({ message: 'Ошибка получения отчета' });
  }
};

// Создание отчета и автоматическое создание занятий
export const createReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { report_date, content } = req.body;

    if (!report_date || !content) {
      return res.status(400).json({ message: 'Дата и содержание отчета обязательны' });
    }

    // Создаем отчет
    const reportResult = await pool.query(
      `INSERT INTO reports (report_date, content, created_by)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [report_date, content, userId]
    );

    const report = reportResult.rows[0];

    // Парсим содержание отчета
    const parsedLessons = parseReportContent(content, report_date, userId);

    // Создаем занятия для каждого найденного ученика
    const createdLessons = [];
    for (const { studentName, price } of parsedLessons) {
      // Ищем студента по имени (точное совпадение или частичное)
      const studentResult = await pool.query(
        `SELECT id FROM students 
         WHERE created_by = $1 
         AND (LOWER(name) = LOWER($2) OR LOWER(name) LIKE LOWER($3))
         ORDER BY CASE WHEN LOWER(name) = LOWER($2) THEN 1 ELSE 2 END
         LIMIT 1`,
        [userId, studentName, `%${studentName}%`]
      );

      if (studentResult.rows.length > 0) {
        const studentId = studentResult.rows[0].id;

        // Создаем занятие
        const lessonResult = await pool.query(
          `INSERT INTO lessons (student_id, lesson_date, price, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [studentId, report_date, price, userId]
        );

        const lesson = lessonResult.rows[0];

        // Создаем транзакцию списания
        await pool.query(
          `INSERT INTO transactions (student_id, amount, type, description, lesson_id, created_by)
           VALUES ($1, $2, 'lesson', $3, $4, $5)`,
          [
            studentId,
            price,
            `Занятие ${report_date} (из отчета)`,
            lesson.id,
            userId
          ]
        );

        // Связываем занятие с отчетом
        await pool.query(
          `INSERT INTO report_lessons (report_id, lesson_id)
           VALUES ($1, $2)`,
          [report.id, lesson.id]
        );

        createdLessons.push({ ...lesson, student_name: studentName });
      }
    }

    report.lessons = createdLessons;
    report.parsed_count = parsedLessons.length;
    report.created_count = createdLessons.length;

    res.status(201).json(report);
  } catch (error) {
    console.error('Ошибка создания отчета:', error);
    res.status(500).json({ message: 'Ошибка создания отчета' });
  }
};

// Обновление отчета (удаляет старые занятия и создает новые)
export const updateReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;
    const { report_date, content } = req.body;

    // Проверяем, что отчет принадлежит пользователю
    const checkResult = await pool.query(
      'SELECT id FROM reports WHERE id = $1 AND created_by = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Отчет не найден' });
    }

    // Получаем старые занятия из отчета
    const oldLessonsResult = await pool.query(
      `SELECT lesson_id FROM report_lessons WHERE report_id = $1`,
      [id]
    );

    const oldLessonIds = oldLessonsResult.rows.map(row => row.lesson_id);

    // Удаляем старые транзакции и занятия
    for (const lessonId of oldLessonIds) {
      // Удаляем транзакцию
      await pool.query('DELETE FROM transactions WHERE lesson_id = $1', [lessonId]);
      // Удаляем занятие
      await pool.query('DELETE FROM lessons WHERE id = $1', [lessonId]);
    }

    // Удаляем связи
    await pool.query('DELETE FROM report_lessons WHERE report_id = $1', [id]);

    // Обновляем отчет
    const reportResult = await pool.query(
      `UPDATE reports 
       SET report_date = $1, content = $2, updated_at = CURRENT_TIMESTAMP
       WHERE id = $3
       RETURNING *`,
      [report_date, content, id]
    );

    const report = reportResult.rows[0];

    // Парсим новое содержание и создаем занятия заново
    const parsedLessons = parseReportContent(content, report_date, userId);
    const createdLessons = [];

    for (const { studentName, price } of parsedLessons) {
      const studentResult = await pool.query(
        `SELECT id FROM students 
         WHERE created_by = $1 
         AND (LOWER(name) = LOWER($2) OR LOWER(name) LIKE LOWER($3))
         ORDER BY CASE WHEN LOWER(name) = LOWER($2) THEN 1 ELSE 2 END
         LIMIT 1`,
        [userId, studentName, `%${studentName}%`]
      );

      if (studentResult.rows.length > 0) {
        const studentId = studentResult.rows[0].id;

        const lessonResult = await pool.query(
          `INSERT INTO lessons (student_id, lesson_date, price, created_by)
           VALUES ($1, $2, $3, $4)
           RETURNING *`,
          [studentId, report_date, price, userId]
        );

        const lesson = lessonResult.rows[0];

        await pool.query(
          `INSERT INTO transactions (student_id, amount, type, description, lesson_id, created_by)
           VALUES ($1, $2, 'lesson', $3, $4, $5)`,
          [
            studentId,
            price,
            `Занятие ${report_date} (из отчета)`,
            lesson.id,
            userId
          ]
        );

        await pool.query(
          `INSERT INTO report_lessons (report_id, lesson_id)
           VALUES ($1, $2)`,
          [report.id, lesson.id]
        );

        createdLessons.push({ ...lesson, student_name: studentName });
      }
    }

    report.lessons = createdLessons;
    report.parsed_count = parsedLessons.length;
    report.created_count = createdLessons.length;

    res.json(report);
  } catch (error) {
    console.error('Ошибка обновления отчета:', error);
    res.status(500).json({ message: 'Ошибка обновления отчета' });
  }
};

// Удаление отчета
export const deleteReport = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { id } = req.params;

    // Проверяем, что отчет принадлежит пользователю
    const checkResult = await pool.query(
      'SELECT id FROM reports WHERE id = $1 AND created_by = $2',
      [id, userId]
    );

    if (checkResult.rows.length === 0) {
      return res.status(404).json({ message: 'Отчет не найден' });
    }

    // Получаем занятия из отчета
    const lessonsResult = await pool.query(
      `SELECT lesson_id FROM report_lessons WHERE report_id = $1`,
      [id]
    );

    // Удаляем транзакции и занятия
    for (const row of lessonsResult.rows) {
      await pool.query('DELETE FROM transactions WHERE lesson_id = $1', [row.lesson_id]);
      await pool.query('DELETE FROM lessons WHERE id = $1', [row.lesson_id]);
    }

    // Удаляем отчет (каскадно удалит связи)
    await pool.query('DELETE FROM reports WHERE id = $1', [id]);

    res.json({ message: 'Отчет удален' });
  } catch (error) {
    console.error('Ошибка удаления отчета:', error);
    res.status(500).json({ message: 'Ошибка удаления отчета' });
  }
};

