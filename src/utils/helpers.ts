
export const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(value);
};

export const generateSlug = (text: string) => {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')     // Replace spaces with -
    .replace(/[^\w-]+/g, '')  // Remove all non-word chars
    .replace(/--+/g, '-');    // Replace multiple - with single -
};

export const validateRequiredFields = (data: any, fields: string[]) => {
  const errors: string[] = [];
  fields.forEach(field => {
    if (!data[field] || (Array.isArray(data[field]) && data[field].length === 0)) {
      errors.push(`O campo ${field} é obrigatório.`);
    }
  });
  return errors;
};
