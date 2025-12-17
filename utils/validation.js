import validator from 'validator';

// Валидация email
export const validateEmail = (email) => {
  if (!email || typeof email !== 'string') {
    return { valid: false, message: 'Email обязателен' };
  }
  
  if (!validator.isEmail(email)) {
    return { valid: false, message: 'Неверный формат email' };
  }
  
  return { valid: true };
};

// Валидация пароля
export const validatePassword = (password) => {
  if (!password || typeof password !== 'string') {
    return { valid: false, message: 'Пароль обязателен' };
  }
  
  if (password.length < 6) {
    return { valid: false, message: 'Пароль должен содержать минимум 6 символов' };
  }
  
  if (password.length > 128) {
    return { valid: false, message: 'Пароль слишком длинный (максимум 128 символов)' };
  }
  
  return { valid: true };
};

// Валидация данных регистрации
export const validateRegisterData = (email, password) => {
  const emailValidation = validateEmail(email);
  if (!emailValidation.valid) {
    return emailValidation;
  }
  
  const passwordValidation = validatePassword(password);
  if (!passwordValidation.valid) {
    return passwordValidation;
  }
  
  return { valid: true };
};

// Валидация данных входа
export const validateLoginData = (email, password) => {
  if (!email || !password) {
    return { valid: false, message: 'Email и пароль обязательны' };
  }
  
  return { valid: true };
};

