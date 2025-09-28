import Swal from 'sweetalert2';

// Configuración base de SweetAlert2
const defaultConfig = {
  confirmButtonColor: '#3b82f6',
  cancelButtonColor: '#6b7280',
  showClass: {
    popup: 'animate__animated animate__fadeInDown'
  },
  hideClass: {
    popup: 'animate__animated animate__fadeOutUp'
  }
};

// Función para mostrar mensajes de éxito
export const showSuccess = (message: string, title: string = 'Success!') => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'success',
    title,
    text: message,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
};

// Función para mostrar mensajes de error
export const showError = (message: string, title: string = 'Error!') => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'error',
    title,
    text: message,
    showConfirmButton: true,
    timer: 5000,
    timerProgressBar: true
  });
};

// Función para mostrar mensajes de información
export const showInfo = (message: string, title: string = 'Info') => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'info',
    title,
    text: message,
    timer: 3000,
    timerProgressBar: true,
    showConfirmButton: false,
    toast: true,
    position: 'top-end'
  });
};

// Función para mostrar mensajes de advertencia
export const showWarning = (message: string, title: string = 'Warning!') => {
  return Swal.fire({
    ...defaultConfig,
    icon: 'warning',
    title,
    text: message,
    showConfirmButton: true,
  });
};

// Función para confirmación de eliminación
export const confirmDelete = (
  itemName: string, 
  itemType: string = 'item',
  additionalInfo?: string
) => {
  return Swal.fire({
    ...defaultConfig,
    title: `Delete ${itemType}?`,
    html: `
      <p>Are you sure you want to delete <strong>${itemName}</strong>?</p>
      ${additionalInfo ? `<p class="text-sm text-gray-600 mt-2">${additionalInfo}</p>` : ''}
    `,
    icon: 'warning',
    showCancelButton: true,
    confirmButtonText: `Yes, delete ${itemType}!`,
    cancelButtonText: 'Cancel',
    confirmButtonColor: '#ef4444',
    reverseButtons: true,
    focusCancel: true
  });
};

// Función para confirmación genérica
export const confirmAction = (
  title: string,
  message: string,
  confirmButtonText: string = 'Yes',
  cancelButtonText: string = 'Cancel',
  icon: 'warning' | 'question' | 'info' = 'question'
) => {
  return Swal.fire({
    ...defaultConfig,
    title,
    text: message,
    icon,
    showCancelButton: true,
    confirmButtonText,
    cancelButtonText,
    reverseButtons: true,
    focusCancel: true
  });
};

// Función para formularios de entrada
export const promptInput = (
  title: string,
  inputPlaceholder: string = '',
  inputType: 'text' | 'email' | 'password' | 'number' = 'text',
  validation?: (value: string) => string | null
) => {
  return Swal.fire({
    ...defaultConfig,
    title,
    input: inputType,
    inputPlaceholder,
    showCancelButton: true,
    confirmButtonText: 'Submit',
    cancelButtonText: 'Cancel',
    inputValidator: (value: string) => {
      if (!value) {
        return 'This field is required';
      }
      if (validation) {
        return validation(value);
      }
      return null;
    }
  });
};

// Función para mostrar progreso
export const showLoading = (title: string = 'Processing...', text?: string) => {
  return Swal.fire({
    title,
    text,
    allowOutsideClick: false,
    allowEscapeKey: false,
    showConfirmButton: false,
    didOpen: () => {
      Swal.showLoading();
    }
  });
};

// Función para cerrar el loading
export const closeLoading = () => {
  Swal.close();
};

// Función para mostrar resultados de operaciones
export const showOperationResult = (
  success: boolean,
  successMessage: string,
  errorMessage: string,
  successTitle: string = 'Success!',
  errorTitle: string = 'Error!'
) => {
  if (success) {
    return showSuccess(successMessage, successTitle);
  } else {
    return showError(errorMessage, errorTitle);
  }
};

export default {
  success: showSuccess,
  error: showError,
  info: showInfo,
  warning: showWarning,
  confirmDelete,
  confirmAction,
  promptInput,
  showLoading,
  closeLoading,
  showOperationResult
};