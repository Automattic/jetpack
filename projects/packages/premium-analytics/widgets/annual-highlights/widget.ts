/**
 * WordPress dependencies
 */
import { _x } from '@wordpress/i18n';
import { pin } from '@wordpress/icons';
import type { WidgetAttributeField } from '@wordpress/widget-primitives';

/**
 * Internal dependencies
 */
import { SelectField } from '@jetpack-premium-analytics/fields';
import { getYearElements } from './years';
import type { YearPresetId } from '@jetpack-premium-analytics/datetime';

/**
 * Configurable attributes for the Annual highlights widget. The widget has no
 * date range — the insights endpoint is not period-scoped, and the year below
 * picks a row out of the single payload it returns.
 */
export type AnnualHighlightsAttributes = {
	/**
	 * Year the widget summarizes, as a year preset ID (e.g. `year-2026`).
	 * Absent on an instance whose year was never picked.
	 */
	year?: YearPresetId;
};

/**
 * Widget type definition. The widget type keeps the `annual-highlights` name
 * (saved layouts reference it); its display title in widget.json is "Year in
 * review".
 *
 * `year` is the only attribute and carries `relevance: 'high'`, so the host
 * renders its dropdown in the frame header and the widget body holds nothing
 * but the tiles. No `example` year comes with it: the years on offer depend on
 * the site's own data, so a new instance starts on the one the dropdown lists
 * first — the current year.
 */
export default {
	icon: pin,
	attributes: [
		{
			id: 'year',
			label: _x( 'Year', 'label for the year selector', 'jetpack-premium-analytics-pkg' ),
			type: 'text',
			relevance: 'high',
			Edit: SelectField,
			getElements: getYearElements,
		},
	] as WidgetAttributeField< AnnualHighlightsAttributes >[],
};
