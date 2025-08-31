import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { date as qdate } from 'quasar'

export const useReservationsStore = defineStore('reservations', {
  state: () => ({
    reservations: [],
    waitlist: [
      { id: 'W1', date: new Date().toISOString().slice(0, 10), shiftId: 'dinner', partySize: 2, customerId: 1, notes: 'Puede esperar 30min' },
    ],
    communications: [
      { id: 'M1', type: 'reminder', method: 'sms', offsetHours: 24, active: true },
      { id: 'M2', type: 'thankyou', method: 'email', offsetHours: 2, active: true },
    ],
    loading: false,
    error: null,
  }),
  getters: {
    reservationsByDay: (state) => (yyyyMmDd) => state.reservations.filter((r) => r.date === yyyyMmDd),
    reservationsByTableAndDay: (state) => (tableId, yyyyMmDd) => state.reservations.filter((r) => r.tableId === tableId && r.date === yyyyMmDd),
  },
  actions: {
    toApiRange(dayStr) {
      // Construye rango local sin zona horaria
      const start = `${dayStr}T00:00:00`
      const end = `${dayStr}T23:59:59`
      return { start, end }
    },
    toApiRangeFromTo(startDayStr, endDayStr) {
      const start = `${startDayStr}T00:00:00`
      const end = `${endDayStr}T23:59:59`
      return { start, end }
    },
    mapFromApi(row) {
      const start = qdate.extractDate(row.start_time, 'YYYY-MM-DDTHH:mm:ss') || new Date(row.start_time)
      const end = qdate.extractDate(row.end_time, 'YYYY-MM-DDTHH:mm:ss') || new Date(row.end_time)
      return {
        id: row.id,
        date: qdate.formatDate(start, 'YYYY-MM-DD'),
        time: qdate.formatDate(start, 'HH:mm'),
        durationMin: Math.max(15, Math.round((end - start) / 60000)),
        tableId: row.table_id,
        partySize: row.size,
        customerId: row.customer_id,
        status: row.status === 'cancelled' ? 'cancelled' : 'confirmed',
        notes: row.notes || '',
      }
    },
    mapToApi(res) {
      const startLocal = qdate.extractDate(`${res.date} ${res.time}`, 'YYYY-MM-DD HH:mm')
      const endLocal = new Date(startLocal.getTime() + (res.durationMin || 90) * 60000)
      return {
        customer_id: res.customerId,
        table_id: res.tableId,
        start_time: qdate.formatDate(startLocal, 'YYYY-MM-DDTHH:mm:ss'),
        end_time: qdate.formatDate(endLocal, 'YYYY-MM-DDTHH:mm:ss'),
        size: res.partySize,
        status: res.status === 'cancelled' ? 'cancelled' : 'booked',
        notes: res.notes || null,
      }
    },
    async fetchByDay(yyyyMmDd) {
      this.loading = true
      this.error = null
      try {
        const { start, end } = this.toApiRange(yyyyMmDd)
        const { data } = await api.get('/reservations', { params: { start, end } })
        this.reservations = data.map((r) => this.mapFromApi(r))
      } catch (err) {
        this.error = err?.response?.data?.error || err?.message || 'Error al cargar reservas'
      } finally {
        this.loading = false
      }
    },
    async fetchByRange(startDayStr, endDayStr) {
      this.loading = true
      this.error = null
      try {
        const { start, end } = this.toApiRangeFromTo(startDayStr, endDayStr)
        const { data } = await api.get('/reservations', { params: { start, end } })
        this.reservations = data.map((r) => this.mapFromApi(r))
      } catch (err) {
        this.error = err?.response?.data?.error || err?.message || 'Error al cargar reservas'
      } finally {
        this.loading = false
      }
    },
    async create(res) {
      const payload = this.mapToApi(res)
      const { data } = await api.post('/reservations', payload)
      const mapped = this.mapFromApi(data)
      this.reservations.push(mapped)
      return mapped
    },
    async update(id, res) {
      const payload = this.mapToApi(res)
      const { data } = await api.put(`/reservations/${id}`, payload)
      const mapped = this.mapFromApi(data)
      const idx = this.reservations.findIndex((r) => r.id === id)
      if (idx !== -1) this.reservations[idx] = mapped
      return mapped
    },
    async cancel(id) {
      const found = this.reservations.find((r) => r.id === id)
      if (!found) return
      await this.update(id, { ...found, status: 'cancelled' })
    },
    addToWaitlist(entry) { this.waitlist.push({ ...entry }) },
    removeFromWaitlist(id) { this.waitlist = this.waitlist.filter((w) => w.id !== id) },
    updateCommunication(id, patch) {
      const idx = this.communications.findIndex((m) => m.id === id)
      if (idx !== -1) this.communications[idx] = { ...this.communications[idx], ...patch }
    },
  },
})


