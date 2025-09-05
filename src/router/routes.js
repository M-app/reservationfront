const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', redirect: '/calendar' },
      { path: 'calendar', component: () => import('pages/CalendarPage.vue') },
      { path: 'tables', component: () => import('pages/TablesPage.vue') },
      { path: 'floor-plan', component: () => import('pages/FloorPlanPage.vue') },
      { path: 'customers', component: () => import('pages/CustomersPage.vue') },
      { path: 'reservations', component: () => import('pages/ReservationsPage.vue') },
      { path: 'waitlist', component: () => import('pages/WaitlistPage.vue') },
      { path: 'communications', component: () => import('pages/CommunicationsPage.vue') },
      { path: 'settings', component: () => import('pages/SettingsPage.vue') },
      { path: 'reports', component: () => import('pages/ReportsPage.vue') },
      { path: 'zolmi', component: () => import('pages/ZolmiPage.vue') },
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
