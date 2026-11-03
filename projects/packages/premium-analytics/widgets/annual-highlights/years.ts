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
	reportingTimeZone,
	toLocalTZ,
	type YearPresetId,
} from '@jetpack-premium-analytics/datetime';
import type { Option } from '@jetpack-premium-analytics/externals';

/**
 * Oldest year in the insights payload, where the dropdown's list starts.
 */
function findStartYear( data: StatsInsightsResponse | undefined ): number | undefined {
	const years = ( data?.years ?? [] )
		.map( year => Number( year.year ) )
		// A row with no year normalizes to 0, and a bad start year would put
		// centuries of entries in the dropdown.
		.filter( year => Number.isInteger( year ) && year > 1000 );

	if ( years.length === 0 ) {
		return undefined;
	}

	// The browser clock is fine for this floor: an off-by-one at the New Year
	// boundary is immaterial. Year math users see uses the site timezone.
	return Math.max( Math.min( ...years ), new Date().getFullYear() - 50 );
}

/**
 * Years the widget's dropdown offers, current year back to the site's oldest.
 * The host renders the control outside the widget (no hook can reach the
 * report), so this reads the shared query cache `useStatsInsights` fills directly.
 */
export async function getYearElements(): Promise< Option[] > {
	const data = await queryClient.fetchQuery( statsInsightsQuery() ).catch( () => undefined );

	return getYearSurfacePresets( reportingTimeZone(), { startYear: findStartYear( data ) } )
		.filter( preset => preset.id !== PRESET_ALL_TIME )
		.map( preset => ( { value: preset.id, label: preset.label } ) );
}

/**
 * Calendar year the widget summarizes. An instance whose year was never picked
 * reads as the current year, which the dropdown lists first.
 */
export function resolveSelectedYear( year: YearPresetId | undefined ): number {
	return getPresetYear( year ) ?? toLocalTZ( undefined, reportingTimeZone() ).getFullYear();
}
