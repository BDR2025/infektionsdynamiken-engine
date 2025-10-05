/*!
 * File:      chart.widget-mount.js (v2)
 * Purpose:   Header einsetzen + Chart-Controls (Integrator oben, Sim unten rechts) montieren
 * Depends:   @uid/app/widget-header.js, ./chart.widget-actions.js, ./chart.sim-controls.js
 * License:   CC BY 4.0
 */
import { attachWidgetHeader } from '/uid-e_v1/12-4_support/12-42_widgets/header.js';
import { mountChartWidgetActions } from './chart.widget-actions.js';
import { mountChartSimControls } from './chart.sim-controls.js';

export function mountChartHeaderAndButtons(widgetSelector = '#chart-widget', { title = 'Simulation', storageKey = 'uid:chart:on', mode = (document.documentElement.dataset.mode || 'university'), defaultEnabled = true } = {}) {
  const el = (typeof widgetSelector === 'string') ? document.querySelector(widgetSelector) : (widgetSelector && widgetSelector.nodeType === 1 ? widgetSelector : null);
  if (!el) throw new Error(`[chart.mount] host not found: ${widgetSelector}`);

  if (!el.querySelector('.uidw-head')) attachWidgetHeader(el, { title, storageKey, defaultEnabled });

  const actionsApi = mountChartWidgetActions(el, { mode });
  const simApi     = mountChartSimControls(el);

  return { actionsApi, simApi, widgetEl: el };
}
export default { mountChartHeaderAndButtons };
