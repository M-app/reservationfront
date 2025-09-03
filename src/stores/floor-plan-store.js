import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'

export const useFloorPlanStore = defineStore('floorPlan', {
  state: () => ({
    zoom: 1,
    tablesLayout: [],
    boxes: [],
    loading: false,
    error: null,
  }),
  getters: {
    tableLayoutById: (state) => (id) => state.tablesLayout.find((t) => t.id === id),
    boxById: (state) => (id) => state.boxes.find((b) => b.id === id),
  },
  actions: {
    async fetchAll() {
      this.loading = true
      this.error = null
      try {
        const { data } = await api.get('/floor-positions')
        // API devuelve por table_id; normalizamos a { id, x, y, ... }
        this.tablesLayout = data.map((r) => ({ id: r.table_id, x: r.x, y: r.y, shape: (r.meta && JSON.parse(r.meta)?.shape) || 'square' }))
        const boxesRes = await api.get('/floor-boxes')
        this.boxes = boxesRes.data.map((b) => ({
          id: b.id,
          x: b.x,
          y: b.y,
          width: b.width,
          height: b.height,
          label: b.label || '',
          color: b.color || '#E4B860',
          ...(b.meta ? JSON.parse(b.meta) : {}),
        }))
      } catch (err) {
        this.error = err?.message || 'Error al cargar plano'
      } finally {
        this.loading = false
      }
    },
    setZoom(value) { this.zoom = value },
    async upsertTableLayout(entry) {
      // Persistimos en backend por mesa
      const meta = { shape: entry.shape }
      await api.post('/floor-positions', { table_id: entry.id, x: entry.x, y: entry.y, rotation: 0, meta })
      const idx = this.tablesLayout.findIndex((t) => t.id === entry.id)
      if (idx !== -1) this.tablesLayout[idx] = { ...this.tablesLayout[idx], ...entry }
      else this.tablesLayout.push({ id: entry.id, x: entry.x, y: entry.y, shape: entry.shape })
    },
    generateBoxId() {
      const nums = this.boxes
        .map((b) => (typeof b.id === 'string' && b.id.startsWith('B') ? parseInt(b.id.slice(1), 10) : NaN))
        .filter((n) => !Number.isNaN(n))
      const next = (nums.length ? Math.max(...nums) : 0) + 1
      return `B${next}`
    },
    async addBox(box) {
      const id = box.id || this.generateBoxId()
      const newBox = { id, x: 100, y: 100, width: 420, height: 140, label: 'Nuevo', color: '#E4B860', ...box }
      await api.post('/floor-boxes', newBox)
      this.boxes.push(newBox)
    },
    async updateBox(id, patch) {
      const idx = this.boxes.findIndex((b) => b.id === id)
      if (idx !== -1) {
        const updated = { ...this.boxes[idx], ...patch }
        await api.post('/floor-boxes', updated)
        this.boxes[idx] = updated
      }
    },
    async removeBox(id) {
      await api.delete(`/floor-boxes/${id}`)
      this.boxes = this.boxes.filter((b) => b.id !== id)
    },
  },
})


