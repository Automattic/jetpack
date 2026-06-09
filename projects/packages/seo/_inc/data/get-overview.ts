import { getScriptData } from '@automattic/jetpack-script-data';
import type { OverviewResponse } from './overview-types';

type SeoScriptData = {
	seo?: {
		overview?: OverviewResponse;
	};
};

/**
 * Read the aggregated Overview state.
 *
 * The server bootstraps it onto `window.JetpackScriptData.seo.overview` via the
 * `jetpack_admin_js_script_data` filter (see `Initializer::inject_script_data()`),
 * so it's on the page at first paint — the Overview reads it synchronously with
 * no request and no loading state. Returns `null` if the bootstrap is missing.
 *
 * @return The Overview state, or `null` when unavailable.
 */
export default function getOverview(): OverviewResponse | null {
	const scriptData = getScriptData() as SeoScriptData | undefined;
	return scriptData?.seo?.overview ?? null;
}
