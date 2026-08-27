/**
 * External dependencies
 */
import {
	queryClient,
	statsInsightsQuery,
	type StatsInsightsResponse,
} from '@jetpack-premium-analytics/data';
import {
	PRESET_ALL_TIME,
	getPresetYear,
	getYearSurfacePresets,
	siteTimeZone,
	toLocalTZ,
	type YearPresetId,
} from '@jetpack-premium-analytics/datetime';
import type { Option } from '@jetpack-premium-analytics/externals';

/**
 * Oldest year in the insights payload, which is where the dropdown's list
 * starts — the endpoint reports across the whole site lifetime. Rows dated
 * past the current year are intentionally out of reach: the year surface
 * enumerates down from today.
 */
function findStartYear( data: StatsInsightsResponse | undefined ): number | undefined {
	const years = ( data?.years ?? [] )
		.map( year => Number( year.year ) )
		// A row with no year normalizes to '' and then to 0, and a bad start
		// year would put centuries of entries in the dropdown — the clamp below
		// caps the damage a single garbled row can do.
		.filter( year => Number.isInteger( year ) && year > 1000 );

	if ( years.length === 0 ) {
		return undefined;
	}

	// The browser clock is fine for this floor: it guards against garbled
	// rows, where an off-by-one at the New Year boundary is immaterial. Year
	// math the reader can see goes through the site timezone instead.
	return Math.max( Math.min( ...years ), new Date().getFullYear() - 50 );
}

/**
 * Years the widget's dropdown offers: the current year back to the site's
 * oldest year of data, publish gaps included — the year surface the section's
 * own filter used to provide.
 *
 * The host renders the control outside the widget, where no hook can reach the
 * report, so the payload is read straight from the shared query cache. It is
 * the entry `useStatsInsights` fills, so a widget that already loaded costs no
 * request. A payload that never arrives leaves the surface at its default
 * depth rather than at no years at all.
 */
export async function getYearElements(): Promise< Option[] > {
	const data = await queryClient.fetchQuery( statsInsightsQuery() ).catch( () => undefined );

	return getYearSurfacePresets( siteTimeZone(), { startYear: findStartYear( data ) } )
		.filter( preset => preset.id !== PRESET_ALL_TIME )
		.map( preset => ( { value: preset.id, label: preset.label } ) );
}

/**
 * Calendar year the widget summarizes. An instance whose year was never picked
 * carries none and reads as the current year — the entry the dropdown lists
 * first, and so selects on its own.
 */
export function resolveSelectedYear( year: YearPresetId | undefined ): number {
	return getPresetYear( year ) ?? toLocalTZ( undefined, siteTimeZone() ).getFullYear();
}
