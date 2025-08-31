import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useCustomersStore = defineStore('customers', {
  state: () => ({
    customers: [],
    loading: false,
    error: null,
  }),
  getters: {
    customerById: (state) => (id) => state.customers.find((c) => c.id === id),
  },
  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/customers')
        this.customers = data
      } catch (err) {
        this.error = err?.message || 'Error al cargar clientes'
      } finally {
        this.loading = false
      }
    },
    async create(c) {
      const payload = { name: c.name, phone: c.phone || null, email: c.email || null, notes: c.notes || null }
      const { data } = await api.post('/customers', payload)
      this.customers.push(data)
      return data
    },
    async update(id, patch) {
      const current = this.customers.find((x) => x.id === id)
      if (!current) return
      const payload = { name: patch.name ?? current.name, phone: patch.phone ?? current.phone, email: patch.email ?? current.email, notes: patch.notes ?? current.notes }
      const { data } = await api.put(`/customers/${id}`, payload)
      const idx = this.customers.findIndex((x) => x.id === id)
      if (idx !== -1) this.customers[idx] = data
      return data
    },
    async remove(id) {
      await api.delete(`/customers/${id}`)
      this.customers = this.customers.filter((x) => x.id !== id)
    },
  },
})


