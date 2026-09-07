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
 * No date range: the insights endpoint is not period-scoped, and `year` picks a
 * row out of the single payload it returns.
 */
export type AnnualHighlightsAttributes = {
	/** Year preset ID, e.g. `year-2026`. */
	year?: YearPresetId;
};

/**
 * The type keeps the `annual-highlights` name because saved layouts reference it;
 * widget.json titles it "Year in review". No `example` year: the years on offer
 * depend on the site's own data, so a new instance starts on the current year.
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
