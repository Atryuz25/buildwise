// Basic validation utilities

export const isValidPhoneNumber = (phone: string) => {
  const regex = /^\+?[1-9]\d{1,14}$/;
  return regex.test(phone);
};

export const isValidNumber = (val: any) => {
  return typeof val === 'number' && !isNaN(val) && val >= 0;
};

export const validateOptimizationRequest = (data: any) => {
  if (!data || !isValidNumber(data.standardLength)) return false;
  if (!Array.isArray(data.cuts) || data.cuts.length === 0) return false;
  
  for (const cut of data.cuts) {
    if (!isValidNumber(cut.length) || !isValidNumber(cut.quantity)) return false;
  }
  return true;
};
