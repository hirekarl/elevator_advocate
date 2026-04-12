import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

const resources = {
  en: {
    translation: {
      "report_outage": "Report Outage",
      "syncing": "Syncing...",
      "verification_pending": "Verification Pending",
      "verified_status": "Verified Status",
      "no_outages": "No reported outages",
      "house_number": "House Number",
      "street": "Street",
      "borough": "Borough",
      "submit": "Submit",
      "search_address": "Find Your Building",
      "loss_of_service": "Loss of Service (30 Days)",
      "recent_activity": "Recent Activity",
      "address": "Address",
      "building_details": "Building Details",
      "status_up": "Back in Service / Working",
      "status_down": "Out of Service / Inoperative",
      "status_trapped": "Entrapment (People inside)",
      "status_slow": "Slow or Faulty Operation",
      "status_unsafe": "Unsafe (Doors/Leveling)",
      "signup_title": "Join the Advocacy",
      "signup_button": "Create Account",
      "signup_success_check_email": "Success! Check your terminal (dev) or inbox for a confirmation link.",
      "confirming_email": "Verifying your account...",
      "email_confirmed_title": "Account Verified!",
      "email_confirmed_message": "You are now part of the advocacy network. Redirecting to home...",
      "email_confirm_error_title": "Verification Failed",
      "email_confirm_error_message": "The link is invalid or has expired. Please try signing up again.",
      "login_required": "Please sign up or log in to report an elevator outage.",
      "username": "Username",
      "password": "Password",
      "email": "Email Address"
    }
  },
  es: {
    translation: {
      "report_outage": "Reportar interrupción",
      "syncing": "Sincronizando...",
      "verification_pending": "Verificación pendiente",
      "verified_status": "Estado verificado",
      "no_outages": "No hay interrupciones reportadas",
      "house_number": "Número de casa",
      "street": "Calle",
      "borough": "Distrito (Borough)",
      "submit": "Enviar",
      "search_address": "Encontrar Su Edificio",
      "loss_of_service": "Pérdida de servicio (30 días)",
      "recent_activity": "Actividad reciente",
      "address": "Dirección",
      "building_details": "Detalles del edificio",
      "status_up": "De nuevo en servicio / Funcionando",
      "status_down": "Fuera de servicio / No funciona",
      "status_trapped": "Atrapamiento (Gente dentro)",
      "status_slow": "Funcionamiento lento o fallido",
      "status_unsafe": "Inseguro (Puertas/Nivelación)",
      "signup_title": "Únete a la Abogacía",
      "signup_button": "Crear Cuenta",
      "signup_success_check_email": "¡Éxito! Revisa tu terminal (dev) o bandeja de entrada para el enlace.",
      "confirming_email": "Verificando su cuenta...",
      "email_confirmed_title": "¡Cuenta Verificada!",
      "email_confirmed_message": "Ahora eres parte de la red de abogacía. Redirigiendo al inicio...",
      "email_confirm_error_title": "Verificación Fallida",
      "email_confirm_error_message": "El enlace no es válido o ha expirado. Intente registrarse de nuevo.",
      "login_required": "Por favor, regístrese para reportar una interrupción del ascensor.",
      "username": "Nombre de usuario",
      "password": "Contraseña",
      "email": "Correo electrónico"
    }
  }
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: "en",
    interpolation: {
      escapeValue: false
    }
  });

export default i18n;
