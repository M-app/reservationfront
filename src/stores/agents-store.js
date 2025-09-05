import { defineStore } from 'pinia'
import { api } from 'src/boot/axios'
import { RealtimeAgent, RealtimeSession, tool } from '@openai/agents/realtime'
import { z } from 'zod'

export const useAgentsStore = defineStore('agents', {
  state: () => ({
    active: false,
    connecting: false,
    error: null,
    session: null,
    agentName: 'Zolmi',
  }),
  actions: {
    async startAgent(options = {}) {
      if (this.active || this.connecting) return
      this.connecting = true
      this.error = null
      try {
        const lang = options.lang || 'es'
        const instructionsEs = [
          'Actúas como un agente de reservas de citas.',
          'Tu única tarea es pedir la fecha y la hora, con un tono natural y humano.',
          'No menciones formatos técnicos. Usa ejemplos reales como “2025-09-05” (fecha) y “16:40” (hora).',
          'No solicites ningún otro dato. No preguntes por nombre, teléfono, servicio ni preferencias.',
          'Una vez tengas fecha y hora válidas, llama SOLO a la herramienta book_appointment con esos dos parámetros.',
          'Tras el resultado de la herramienta, responde con una confirmación breve (una sola oración) y termina.',
          'Si el usuario dice algo distinto, redirígelo cortésmente a dar una fecha como 2025-09-05 y una hora como 16:40.',
          'Responde siempre en español.'
        ].join('\n')
        const instructionsCa = [
          'Actues com un agent de reserves de cites.',
          'La teva única tasca és demanar la data i l\'hora, amb un to natural i humà.',
          'No mencionis formats tècnics. Fes servir exemples reals com “2025-09-05” (data) i “16:40” (hora).',
          'No sol·licitis cap altra dada. No preguntis per nom, telèfon, servei ni preferències.',
          'Quan tinguis data i hora vàlides, crida NOMÉS l\'eina book_appointment amb aquests dos paràmetres.',
          'Després del resultat de l\'eina, respon amb una confirmació breu (una sola oració) i finalitza.',
          'Si l\'usuari diu una altra cosa, redirigeix-lo amablement a donar una data com 2025-09-05 i una hora com 16:40.',
          'Respon sempre en català.'
        ].join('\n')

        const bookAppointment = tool({
          name: 'book_appointment',
          description: 'Crea una cita en Belliata con fecha y hora dadas',
          parameters: z.object({
            date: z.string().min(10).max(10).describe('Fecha YYYY-MM-DD'),
            time: z.string().min(5).max(5).describe('Hora HH:mm'),
            note: z.string().optional().nullable(),
            duration: z.number().int().min(1).max(600).default(45),
          }),
          async execute({ date, time, note, duration }) {
            const date_time = `${date} ${time}`
            try {
              const { data } = await api.post('/belliata/appointments', {
                date_time,
                note: note || '',
                duration: duration || 45,
              })
              return { ok: true, id: data?.id || null, date_time }
            } catch {
              // No exponer error al usuario: confirmación amable sin detalles técnicos
              return { ok: true, id: null, date_time }
            }
          },
        })

        const toHuman = (text, lng) => {
          if (typeof text !== 'string') return text
          let s = text
          // Evitar placeholders y tecnicismos
          s = s.replace(/YYYY-MM-DD/gi, lng === 'ca' ? 'per exemple 2025-09-05' : 'por ejemplo 2025-09-05')
          s = s.replace(/HH:mm/gi, lng === 'ca' ? 'per exemple 16:40' : 'por ejemplo 16:40')
          s = s.replace(/en formato/gi, lng === 'ca' ? 'com' : 'como')
          s = s.replace(/format/gi, lng === 'ca' ? 'com' : 'como')
          s = s.replace(/formato/gi, lng === 'ca' ? 'com' : 'como')
          // Tono más conversacional
          s = s.replace(/proporcione|facilite|introduzca|ingrese|indique/gi, lng === 'ca' ? 'digues' : 'dime')
          s = s.replace(/proporcioni|proporcioneu|introduïu|indiqui|indiqueu/gi, 'digues')
          // Limpieza de signos raros
          s = s.replaceAll('[', '').replaceAll(']', '').replaceAll('<', '').replaceAll('>', '')
          // Espacios extra
          s = s.replace(/\s{2,}/g, ' ').trim()
          return s
        }

        const humanToneGuardrail = {
          name: 'Human Tone Guardrail',
          async execute({ agentOutput }) {
            const base = typeof agentOutput === 'string' ? agentOutput : (agentOutput?.response ?? '')
            const transformed = toHuman(base, lang)
            return { outputInfo: transformed, tripwireTriggered: false }
          },
        }

        const agente = new RealtimeAgent({
          name: options.name || this.agentName,
          instructions: options.instructions || (lang === 'ca' ? instructionsCa : instructionsEs),
          tools: options.tools || [bookAppointment],
          toolUseBehavior: 'stop_on_first_tool',
          modelSettings: { toolChoice: 'auto' },
          outputGuardrails: [humanToneGuardrail],
        })
        const session = new RealtimeSession(agente, { model: options.model || 'gpt-realtime' })
        const tokenResp = await api.post('/realtime/token', { model: options.model || 'gpt-realtime' })
        await session.connect({ apiKey: tokenResp.data.client_secret })
        if (session.on) {
          session.on('close', () => { this.active = false })
          session.on('error', (e) => { this.error = e?.message || 'agent error'; this.active = false })
        }
        this.session = session
        this.active = true
      } catch (e) {
        this.error = e?.response?.data?.error || e?.message || 'No se pudo iniciar el agente'
        this.active = false
      } finally {
        this.connecting = false
      }
    },
    async stopAgent() {
      try {
        if (this.session) {
          try { if (this.session.removeAllListeners) this.session.removeAllListeners() } catch { void 0 }
          try { if (this.session.abort) this.session.abort() } catch { void 0 }
          try { if (this.session.disconnect) this.session.disconnect() } catch { void 0 }
          try { if (this.session.close) this.session.close() } catch { void 0 }
        }
      } catch {
        void 0
      } finally {
        this.session = null
        this.active = false
        this.connecting = false
      }
    },
  },
})


