import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

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
    async loadAll() {
      try {
        const { data } = await api.get('/settings')
        for (const row of data) {
          try {
            const parsed = JSON.parse(row.value)
            this[row.key] = parsed
          } catch {
            this[row.key] = row.value
          }
        }
      } catch {
        // silencioso
      }
    },
    async save(key, value) {
      await api.post('/settings', { key, value })
      this[key] = value
    },
    updateSlotMinutes(minutes) {
      this.slotMinutes = minutes
    },
    updateOpenHours(start, end) {
      this.openStart = start
      this.openEnd = end
    },
  },
})


