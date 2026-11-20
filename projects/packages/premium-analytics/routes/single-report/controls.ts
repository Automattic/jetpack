/**
 * External dependencies
 */
import { MENU_SURFACE_PRESETS_WITH_ALL_TIME } from '@jetpack-premium-analytics/datetime';
import { resolveFieldTypes } from '@jetpack-premium-analytics/fields';
import { __ } from '@wordpress/i18n';
/**
 * Internal dependencies
 */
import type { SingleReportControlField, SingleReportControls } from './registry';
import type { Field } from '@jetpack-premium-analytics/externals';

/**
 * The item the page's controls edit: `reportParams` is the key the `jpa/report-params` field
 * reads and writes, `allTimeStart` the All time anchor it reads.
 */
export type ControlsItem = {
	reportParams: Record< string, unknown >;
	allTimeStart?: string;
};

/**
 * The control a record gets when it declares none: a date range over the detail presets.
 *
 * @return The field declaration.
 */
function defaultDateControl(): SingleReportControlField {
	return {
		id: 'reportParams',
		type: 'jpa/report-params',
		label: __( 'Date range', 'jetpack-premium-analytics-pkg' ),
		elements: MENU_SURFACE_PRESETS_WITH_ALL_TIME.map( value => ( { value, label: value } ) ),
	};
}

/**
 * The DataForm fields of a page's header controls: the fields the record declares, resolved
 * through the registered field types, or the default date control for a record without any.
 *
 * @param controls - The record's controls for the active section.
 * @return The resolved fields, empty for a page without controls.
 */
export function buildControlFields( controls: SingleReportControls ): Field< ControlsItem >[] {
	const declarations = controls ?? [ defaultDateControl() ];

	return resolveFieldTypes( declarations ) as unknown as Field< ControlsItem >[];
}
