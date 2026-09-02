import { onMounted, ref } from 'vue'
import { callPath } from '@/utils/api'

/**
 * The other Frappe apps installed on this site, for the sidebar's app switcher.
 *
 * `frappe.apps.get_apps` is the same whitelisted endpoint Frappe's own /apps
 * screen and Desk switcher use, so an app appears here exactly when it declares
 * `add_to_apps_screen` in its hooks and the viewer passes its `has_permission`
 * check. Frappe itself is excluded from that payload, which is why the Desk
 * link is added by the caller rather than coming from this list.
 */
export function useFrappeApps({ exclude = [] } = {}) {
  const apps = ref([])

  onMounted(async () => {
    try {
      const installed = (await callPath('frappe.apps.get_apps')) || []
      apps.value = installed.filter((app) => !exclude.includes(app.name))
    } catch {
      // A site that blocks the endpoint, or a session that cannot read it,
      // should still get a working menu — just one without the app list.
      apps.value = []
    }
  })

  return { apps }
}
