import { defineStore } from 'pinia'

export const useSettingsStore = defineStore('settings', {
  state: () => ({
    slotMinutes: 15,
    operatingDays: [0, 1, 2, 3, 4, 5, 6], // 0=Sunday
    openStart: '12:00',
    openEnd: '23:00',
  }),
  getters: {
    // no-op getters retained for compatibility can be added later if needed
  },
  actions: {
    updateSlotMinutes(minutes) {
      this.slotMinutes = minutes
    },
    updateOpenHours(start, end) {
      this.openStart = start
      this.openEnd = end
    },
  },
})


