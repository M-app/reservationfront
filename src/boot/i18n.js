import { defineBoot } from '#q-app/wrappers'
import { createI18n } from 'vue-i18n'

const messages = {
  es: {
    app: {
      title: 'Restaurante CRM',
      save: 'Guardar',
      cancel: 'Cancelar',
      settings: 'Configuración',
    },
    customers: {
      new: 'Nuevo cliente',
      sheet: 'Ficha de cliente',
      name: 'Nombre',
      phone: 'Teléfono',
      notes: 'Preferencias / Notas',
    },
    tables: {
      add: 'Añadir mesa',
      new: 'Nueva mesa',
      name: 'Nombre',
      capacity: 'Capacidad',
    },
    menu: {
      calendar: 'Calendario',
      tables: 'Mesas',
      floor: 'Plano',
      customers: 'Clientes',
      reservations: 'Reservas',
      reports: 'Reportes',
    },
    
    settings: {
      title: 'Configuración',
      schedule: 'Horario',
      open: 'Apertura (HH:mm)',
      close: 'Cierre (HH:mm)',
      interval: 'Intervalo (min)',
      language: 'Idioma',
      spanish: 'Español',
      catalan: 'Catalán',
    },
    calendar: {
      no_reservations: 'Sin reservas',
    },
    reservations: {
      from: 'Desde',
      to: 'Hasta',
      new: 'Nueva reserva',
      date: 'Fecha',
      time: 'Hora',
      table: 'Mesa',
      party: 'Comensales',
      existingCustomer: 'Seleccionar cliente existente',
      customer: 'Cliente',
      conflict: 'La mesa seleccionada ya está ocupada en esa fecha y hora.',
    },
  },
  ca: {
    tables: {
      add: 'Afegir taula',
      new: 'Nova taula',
      name: 'Nom',
      capacity: 'Capacitat',
    },
    customers: {
      new: 'Client nou',
      sheet: 'Fitxa de client',
      name: 'Nom',
      phone: 'Telèfon',
      notes: 'Preferències / Notes',
    },
    app: {
      title: 'Restaurant CRM',
      save: 'Desar',
      cancel: 'Cancel·lar',
      settings: 'Configuració',
    },
    menu: {
      calendar: 'Calendari',
      tables: 'Taules',
      floor: 'Plànol',
      customers: 'Clients',
      reservations: 'Reserves',
      reports: 'Informes',
    },
    settings: {
      title: 'Configuració',
      schedule: 'Horari',
      open: 'Obertura (HH:mm)',
      close: 'Tancament (HH:mm)',
      interval: 'Interval (min)',
      language: 'Idioma',
      spanish: 'Espanyol',
      catalan: 'Català',
    },
    calendar: {
      no_reservations: 'Sense reserves',
    },
    reservations: {
      from: 'Des de',
      to: 'Fins a',
      new: 'Nova reserva',
      date: 'Data',
      time: 'Hora',
      table: 'Taula',
      party: 'Comensals',
      existingCustomer: 'Seleccionar client existent',
      customer: 'Client',
      conflict: 'La taula seleccionada ja està ocupada en aquesta data i hora.',
    },
  },
}

const STORAGE_KEY = 'locale'

export default defineBoot(({ app }) => {
  const locale = localStorage.getItem(STORAGE_KEY) || 'es'
  const i18n = createI18n({ legacy: false, locale, fallbackLocale: 'es', messages })
  app.use(i18n)
})

export function setLocale(locale) {
  localStorage.setItem(STORAGE_KEY, locale)
}

