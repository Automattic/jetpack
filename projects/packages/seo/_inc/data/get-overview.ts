import { getPreloaded, OVERVIEW_PATH } from './get-preloaded';
import type { OverviewResponse } from './overview-types';

/**
 * Read the aggregated Overview state from the page's preload.
 *
 * The server preloads it onto the page (see `Initializer::inject_script_data()`),
 * so on a normal load it's present at first paint and the Overview reads it
 * synchronously — no request, no loading state. Returns `null` when the preload
 * is missing; the Overview stage then fetches it via the REST route rather than
 * dead-ending (see [use-ensure-tab-data]).
 *
 * @return The Overview state, or `null` when not preloaded.
 */
export default function getOverview(): OverviewResponse | null {
	return getPreloaded< OverviewResponse >( OVERVIEW_PATH ) ?? null;
}
