import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useWaitlistStore = defineStore('waitlist', {
  state: () => ({
    items: [],
    loading: false,
    error: null,
  }),
  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/waitlist')
        this.items = data
      } catch (err) {
        this.error = err?.message || 'Error al cargar lista de espera'
      } finally {
        this.loading = false
      }
    },
    async create(entry) {
      const payload = { customer_name: entry.customer_name, phone: entry.phone || null, party_size: entry.party_size, requested_time: entry.requested_time || null, status: entry.status || 'waiting', notes: entry.notes || null }
      const { data } = await api.post('/waitlist', payload)
      this.items.push(data)
      return data
    },
    async update(id, patch) {
      const current = this.items.find((x) => x.id === id)
      if (!current) return
      const payload = {
        customer_name: patch.customer_name ?? current.customer_name,
        phone: patch.phone ?? current.phone,
        party_size: patch.party_size ?? current.party_size,
        requested_time: patch.requested_time ?? current.requested_time,
        status: patch.status ?? current.status,
        notes: patch.notes ?? current.notes,
      }
      const { data } = await api.put(`/waitlist/${id}`, payload)
      const idx = this.items.findIndex((x) => x.id === id)
      if (idx !== -1) this.items[idx] = data
      return data
    },
    async remove(id) {
      await api.delete(`/waitlist/${id}`)
      this.items = this.items.filter((x) => x.id !== id)
    },
  },
})
