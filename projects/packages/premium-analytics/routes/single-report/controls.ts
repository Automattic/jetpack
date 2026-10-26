/**
 * External dependencies
 */
import { MENU_SURFACE_PRESETS_WITH_ALL_TIME } from '@jetpack-premium-analytics/datetime';
import { resolveFieldTypes } from '@jetpack-premium-analytics/fields';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { SingleReportControls } from './registry';
import type { Field } from '@jetpack-premium-analytics/externals';

export const REPORT_PARAMS_FIELD_ID = 'reportParams';

/**
 * The item the page's controls edit.
 */
export type ControlsItem = {
	reportParams: Record< string, unknown >;
	allTimeStart?: string;
};

/**
 * The DataForm fields of a page's date controls: one `jpa/report-params` field over the
 * presets the record lists, the detail presets by default, or none at all.
 *
 * @param controls - The record's controls for the active section.
 * @return The resolved fields, empty for a page without controls.
 */
export function buildControlFields( controls: SingleReportControls ): Field< ControlsItem >[] {
	if ( controls === false ) {
		return [];
	}

	const presets: readonly string[] = controls?.presets ?? MENU_SURFACE_PRESETS_WITH_ALL_TIME;

	return resolveFieldTypes( [
		{
			id: REPORT_PARAMS_FIELD_ID,
			type: 'jpa/report-params',
			label: __( 'Date range', 'jetpack-premium-analytics-pkg' ),
			elements: presets.map( value => ( { value, label: value } ) ),
		},
	] ) as unknown as Field< ControlsItem >[];
}
