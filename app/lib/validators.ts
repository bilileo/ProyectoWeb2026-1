// Validaciones
export const validators = {
  productName: (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'El nombre del producto es requerido';
    }
    if (value.trim().length < 3) {
      return 'El nombre debe tener al menos 3 caracteres';
    }
    if (value.trim().length > 100) {
      return 'El nombre no puede exceder 100 caracteres';
    }
    return '';
  },

  price: (value: number | string) => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue) || numValue <= 0) {
      return 'El precio debe ser mayor a 0';
    }
    if (numValue > 999999) {
      return 'El precio no puede ser tan alto';
    }
    return '';
  },

  stock: (value: number | string) => {
    const numValue = typeof value === 'string' ? parseInt(value) : value;
    if (isNaN(numValue) || numValue < 0) {
      return 'El stock no puede ser negativo';
    }
    if (!Number.isInteger(numValue)) {
      return 'El stock debe ser un número entero';
    }
    if (numValue > 999999) {
      return 'El stock no puede ser tan alto';
    }
    return '';
  },

  category: (value: string) => {
    if (!value || value.trim().length === 0) {
      return 'Debes seleccionar una categoría';
    }
    return '';
  },

  description: (value: string) => {
    if (value && value.trim().length > 500) {
      return 'La descripción no puede exceder 500 caracteres';
    }
    return '';
  },
};

// Validar formulario completo
export const validateProductForm = (data: any) => {
  const errors: Record<string, string> = {};

  const nameError = validators.productName(data.name);
  if (nameError) errors.name = nameError;

  const priceError = validators.price(data.price);
  if (priceError) errors.price = priceError;

  const stockError = validators.stock(data.stock);
  if (stockError) errors.stock = stockError;

  const categoryError = validators.category(data.category_id);
  if (categoryError) errors.category_id = categoryError;

  const descError = validators.description(data.description);
  if (descError) errors.description = descError;

  return errors;
};
