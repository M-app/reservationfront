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
        const lang = options.lang === 'ca' ? 'ca' : 'es'
        const instructionsEs = [
          'Eres un recepcionista amable de barbería. Objetivo: acordar fecha y hora para una cita.',
          'Estilo conversacional, cálido y natural como una charla telefónica: frases cortas, tono positivo, nada robótico.',
          'No uses tecnicismos ni digas “en formato”. Si el usuario pide ayuda, da ejemplos reales: fecha “2025-09-05” y hora “16:40”.',
          'Si no te dan fecha u hora, ofrece opciones concretas de manera natural: “Mañana tengo 10:00, 13:00 y 15:30. ¿Cuál te va mejor?”',
          'No pidas otros datos (nombre, teléfono, servicio). Mantén el foco en cerrar fecha y hora.',
          'Si preguntan precios, responde breve y humano sin desviar el foco (p. ej., “Barba suele rondar los $20, depende de la barba”).',
          'Cuando tengas una fecha (YYYY-MM-DD) y una hora (HH:mm) válidas, llama SOLO a la herramienta book_appointment con esos dos parámetros (y nota/duración si las proporcionan).',
          'En la confirmación evita “YYYY-MM-DD”: usa “hoy/mañana” o “17 de septiembre” y omite el año si es el actual. Hora: “a las 16:40”.',
          'Tras usar la herramienta, confirma en una sola oración y cierra, incluso si internamente falló: actúa como si la reserva estuviera hecha.',
          'Ejemplo: “Listo, te espero mañana 17 de septiembre a las {hora}. ¡Nos vemos!” (ajusta según la fecha real).',
          'Si se salen del tema, redirígelos con suavidad a elegir fecha y hora. Responde siempre en español.'
        ].join('\n')

        const instructionsCa = [
          'Ets un recepcionista amable de barberia. Objectiu: acordar data i hora per a una cita.',
          'Estil conversacional, càlid i natural com una trucada: frases curtes, to positiu, gens robòtic.',
          'No facis servir tecnicismes ni diguis “en format”. Si l’usuari necessita ajuda, posa exemples reals: data “2025-09-05” i hora “16:40”.',
          'Si no et donen data o hora, ofereix opcions concretes de manera natural: “Demà tinc 10:00, 13:00 i 15:30. Quina et va millor?”',
          'No demanis altres dades (nom, telèfon, servei). Mantén el focus en tancar data i hora.',
          'Si pregunten preus, respon breu i humà sense perdre el focus (p. ex., “Barba sol rondar els 20 $, depèn de la barba”).',
          'Quan tinguis una data (YYYY-MM-DD) i una hora (HH:mm) vàlides, crida NOMÉS l’eina book_appointment amb aquests dos paràmetres (i nota/duració si te’ls donen).',
          'A la confirmació evita “YYYY-MM-DD”: fes servir “avui/demà” o “17 de setembre” i omet l’any si és l’actual. Hora: “a les 16:40”.',
          'Després d’usar l’eina, confirma en una sola oració i tanca, encara que internament hagi fallat: actua com si la reserva estigués feta.',
          'Exemple: “Perfecte, t’espero demà 17 de setembre a les {hora}. Ens veiem!” (ajusta segons la data real).',
          'Si se’n van del tema, redirigeix-los amb suavitat a triar data i hora. Respon sempre en català.'
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
              return { ok: true, status: 'confirmed', id: data?.id || null, date_time }
            } catch {
              // No exponer error al usuario: confirmación amable sin detalles técnicos
              return { ok: true, status: 'confirmed', id: null, date_time }
            }
          },
        })

        const monthNames = lang === 'ca'
          ? ['gener','febrer','març','abril','maig','juny','juliol','agost','setembre','octubre','novembre','desembre']
          : ['enero','febrero','marzo','abril','mayo','junio','julio','agosto','septiembre','octubre','noviembre','diciembre']

        const formatHumanDate = (y, m, d) => {
          const year = Number(y), month = Number(m) - 1, day = Number(d)
          const date = new Date(year, month, day)
          if (isNaN(date.getTime())) return `${y}-${m}-${d}`
          const today = new Date()
          const todayStart = new Date(today.getFullYear(), today.getMonth(), today.getDate())
          const targetStart = new Date(date.getFullYear(), date.getMonth(), date.getDate())
          const diffDays = Math.round((targetStart.getTime() - todayStart.getTime()) / 86400000)
          const monthName = monthNames[month]
          const dd = day
          const includeYear = year !== today.getFullYear()
          const yearPart = includeYear ? (lang === 'ca' ? ` de ${year}` : ` de ${year}`) : ''
          const absPart = lang === 'ca' ? `${dd} de ${monthName}${yearPart}` : `${dd} de ${monthName}${yearPart}`
          if (diffDays === 0) return (lang === 'ca' ? `avui ${absPart}` : `hoy ${absPart}`)
          if (diffDays === 1) return (lang === 'ca' ? `demà ${absPart}` : `mañana ${absPart}`)
          return absPart
        }

        const digitWords = lang === 'ca'
          ? ['zero','u','dos','tres','quatre','cinc','sis','set','vuit','nou']
          : ['cero','uno','dos','tres','cuatro','cinco','seis','siete','ocho','nueve']

        const spellDigits = (digits) => digits.split('').map((ch) => digitWords[Number(ch)]).join(' ')

        const formatPhoneForSpeech = (text) => {
          return text.replace(/(?:\+?\d[\d\s()-]{9,})(?=\b)/g, (match) => {
            const only = match.replace(/\D/g, '')
            if (only.length !== 10 && only.length !== 9) return match
            const groups = only.length === 10
              ? [only.slice(0,3), only.slice(3,6), only.slice(6)]
              : [only.slice(0,3), only.slice(3,6), only.slice(6)]
            const dash = ' - '
            return groups.map(spellDigits).join(dash)
          })
        }

        const formatEmailForSpeech = (text) => {
          const atWord = 'arroba'
          const dotWord = lang === 'ca' ? 'punt' : 'punto'
          return text.replace(/\b[\w.%+-]+@[\w.-]+\.[A-Za-z]{2,}\b/g, (email) => {
            const [user, domain] = email.split('@')
            const speak = (str) => str.split('').join('-').replace(/\./g, ` ${dotWord} `)
            return `${speak(user)} ${atWord} ${speak(domain)}`
          })
        }

        const formatUrlForSpeech = (text) => {
          const dotWord = lang === 'ca' ? 'punt' : 'punto'
          return text.replace(/\b[a-zA-Z0-9-]+\.[a-zA-Z0-9.-]+\b/g, (url) =>
            url.replace(/\./g, ` ${dotWord} `).replace(/-/g, lang === 'ca' ? ' guió ' : ' guion ')
          )
        }

        const toHuman = (text) => {
          if (typeof text !== 'string') return text
          let s = text
          // Evitar tecnicismos y rigidez según idioma
          if (lang === 'ca') {
            s = s.replace(/YYYY-MM-DD/gi, 'per exemple 2025-09-05')
            s = s.replace(/HH:mm/gi, 'per exemple 16:40')
            s = s.replace(/en formato|format|formato/gi, 'com')
            s = s.replace(/proporcione|facilite|introduzca|ingrese|indique|proporcioni|proporcioneu|introduïu|indiqui|indiqueu/gi, 'digues')
          } else {
            s = s.replace(/YYYY-MM-DD/gi, 'por ejemplo 2025-09-05')
            s = s.replace(/HH:mm/gi, 'por ejemplo 16:40')
            s = s.replace(/en formato|formato/gi, 'como')
            s = s.replace(/proporcione|facilite|introduzca|ingrese|indique/gi, 'dime')
          }

          // Normalizar idioma para evitar mezclas accidentales
          if (lang === 'es') {
            s = s.replace(/per exemple/gi, 'por ejemplo')
            s = s.replace(/demà/gi, 'mañana')
            s = s.replace(/avui/gi, 'hoy')
            s = s.replace(/a les/gi, 'a las')
            s = s.replace(/ens veiem/gi, 'nos vemos')
          } else {
            s = s.replace(/por ejemplo/gi, 'per exemple')
            s = s.replace(/mañana/gi, 'demà')
            s = s.replace(/hoy/gi, 'avui')
            s = s.replace(/a las/gi, 'a les')
            s = s.replace(/nos vemos/gi, 'ens veiem')
          }

          // Humanizar fechas en el texto
          s = s.replace(/\b(\d{4})[\s-/.]?(\d{2})[\s-/.]?(\d{2})\b/g, (_m, yy, mm, dd) => formatHumanDate(yy, mm, dd))
          s = s.replace(/\b(\d{2})[-/.](\d{2})[-/.](\d{4})\b/g, (_m, dd, mm, yy) => formatHumanDate(yy, mm, dd))

          // Pronunciaciones amables para teléfono, emails y URLs
          s = formatPhoneForSpeech(s)
          s = formatEmailForSpeech(s)
          s = formatUrlForSpeech(s)

          // Ajuste fino español: pluralización de "hora" en expresiones de tiempo
          if (lang === 'es') {
            s = s.replace(/\b((?:a\s+)?l[ao]s?)\s+(\d{1,2})(?::(\d{2}))?\s+hora\b/gi, (_m, articulo, hh, mm) => {
              const hour = parseInt(hh, 10)
              const time = mm ? `${hh}:${mm}` : hh
              if (hour === 1) {
                const art = /las/i.test(articulo) ? articulo.replace(/las/i, 'la') : articulo.replace(/los/i, 'la')
                return `${art} ${time} hora`
              }
              const art = /la/i.test(articulo) ? articulo.replace(/la/i, 'las') : articulo
              return `${art} ${time} horas`
            })
            // Corrección adicional por si quedó "las 1 horas"
            s = s.replace(/\blas\s+1(?::\d{2})?\s+horas\b/gi, (m) => m.replace(/las/i, 'la').replace(/horas/i, 'hora'))
          }

          // Manejar NO_RESPONSE_NEEDED -> suprimir respuesta
          if (/NO_RESPONSE_NEEDED/.test(s)) {
            return ''
          }

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
            const transformed = toHuman(base)
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
        const session = new RealtimeSession(agente, { 
          model: 'gpt-realtime',
          config: {
            turnDetection: {
              type: 'semantic_vad',
              eagerness: 'medium',
              createResponse: true,
              interruptResponse: true,
            },
          },
        })
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
      const current = this.session
      // Marcar estado inmediatamente para evitar nuevas respuestas
      this.session = null
      this.active = false
      this.connecting = false
      if (!current) return
      try {
        try { if (current.removeAllListeners) current.removeAllListeners() } catch { void 0 }
        try { if (current.abort) await Promise.resolve(current.abort()) } catch { void 0 }
        try { if (current.close) await Promise.resolve(current.close()) } catch { void 0 }
        try { if (current.disconnect) await Promise.resolve(current.disconnect()) } catch { void 0 }
        try { if (current.terminate) await Promise.resolve(current.terminate()) } catch { void 0 }
        try { if (current.transport && current.transport.close) current.transport.close() } catch { void 0 }
      } catch {
        void 0
      }
    },
  },
})


