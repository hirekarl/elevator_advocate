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
      "submit": "Submit"
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
      "borough": "Borough",
      "submit": "Enviar"
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
