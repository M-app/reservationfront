import { defineStore } from '#q-app/wrappers'
import { createPinia } from 'pinia'

/*
 * If not building with SSR mode, you can
 * directly export the Store instantiation;
 *
 * The function below can be async too; either use
 * async/await or return a Promise which resolves
 * with the Store instance.
 */

export default defineStore((/* { ssrContext } */) => {
  const pinia = createPinia()

  // Persistencia simple en localStorage por store
  const persistPlugin = ({ store }) => {
    const storageKey = `mcpcrm-${store.$id}`
    try {
      const fromStorage = localStorage.getItem(storageKey)
      if (fromStorage) {
        store.$patch(JSON.parse(fromStorage))
      }
    } catch {
      // ignore
    }
    store.$subscribe((_, state) => {
      try {
        localStorage.setItem(storageKey, JSON.stringify(state))
      } catch {
        // ignore
      }
    }, { detached: true })
  }

  pinia.use(persistPlugin)

  return pinia
})
