/**
 * External dependencies
 */
import { chartLine } from '@jetpack-premium-analytics/icons';
import { __ } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import ToggleGroupField from '../field-toggle-group/toggle-group-field';
import type { DataFormControlProps, Option } from '@jetpack-premium-analytics/externals';
import type { ReactElement } from 'react';

/**
 * How a time series is drawn: the two values the control writes.
 */
export type LineOrBar = 'line' | 'bar';

type LineOrBarOption = Option & { value: LineOrBar; icon: ReactElement };

/**
 * The options are the dashboard's own, so an attribute names the type and carries none.
 */
export const LINE_OR_BAR_OPTIONS: LineOrBarOption[] = [
	{ value: 'line', label: __( 'Line chart', 'jetpack-premium-analytics-pkg' ), icon: chartLine },
	{ value: 'bar', label: __( 'Bar chart', 'jetpack-premium-analytics-pkg' ), icon: chartBar },
];

/**
 * Edit control for `jpa/line-or-bar`: a `ToggleGroupField` over the fixed options, whatever
 * `elements` the attribute carries.
 */
export default function LineOrBarField< Item >( props: DataFormControlProps< Item > ) {
	return (
		<ToggleGroupField
			{ ...props }
			field={ { ...props.field, elements: LINE_OR_BAR_OPTIONS, getElements: undefined } }
		/>
	);
}
