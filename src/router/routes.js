const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/salon/calendar' },
      { path: 'calendar', component: () => import('pages/CalendarPage.vue') },
      { path: 'tables', component: () => import('pages/TablesPage.vue') },
      { path: 'floor-plan', component: () => import('pages/FloorPlanPage.vue') },
      { path: 'customers', component: () => import('pages/CustomersPage.vue') },
      { path: 'reservations', component: () => import('pages/ReservationsPage.vue') },
      { path: 'waitlist', component: () => import('pages/WaitlistPage.vue') },
      { path: 'communications', component: () => import('pages/CommunicationsPage.vue') },
      { path: 'settings', component: () => import('pages/SettingsPage.vue') },
      { path: 'reports', component: () => import('pages/ReportsPage.vue') },

      // Salon routes
      { path: 'salon/services', component: () => import('pages/salon/SalonServicesPage.vue') },
      { path: 'salon/clients', component: () => import('pages/salon/SalonClientsPage.vue') },
      { path: 'salon/appointments', component: () => import('pages/salon/SalonAppointmentsPage.vue') },
      { path: 'salon/availability', component: () => import('pages/salon/SalonAvailabilityPage.vue') },
      { path: 'salon/settings', component: () => import('pages/salon/SalonSettingsPage.vue') },
      { path: 'salon/calendar', component: () => import('pages/salon/SalonCalendarPage.vue') },
    ],
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue'),
  },
]

export default routes
