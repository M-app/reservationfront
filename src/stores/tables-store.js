import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useTablesStore = defineStore('tables', {
  state: () => ({
    tables: [],
    loading: false,
    error: null,
  }),
  getters: {
    activeTables: (state) => state.tables.filter((t) => t.status !== 'reserved' && t.status !== 'occupied'),
  },
  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/tables')
        this.tables = data
      } catch (err) {
        this.error = err?.message || 'Error al cargar mesas'
      } finally {
        this.loading = false
      }
    },
    async create(table) {
      const payload = { name: table.name, capacity: Number(table.capacity), status: 'available' }
      const { data } = await api.post('/tables', payload)
      this.tables.push(data)
      return data
    },
    async update(id, patch) {
      const current = this.tables.find((t) => t.id === id)
      if (!current) return
      const payload = { name: patch.name ?? current.name, capacity: Number(patch.capacity ?? current.capacity), status: patch.status ?? current.status }
      const { data } = await api.put(`/tables/${id}`, payload)
      const idx = this.tables.findIndex((t) => t.id === id)
      if (idx !== -1) this.tables[idx] = data
      return data
    },
    async remove(id) {
      await api.delete(`/tables/${id}`)
      this.tables = this.tables.filter((t) => t.id !== id)
    },
  },
})


