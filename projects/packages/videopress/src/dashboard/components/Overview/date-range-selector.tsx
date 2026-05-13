import { DropdownMenu } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import type { DateRange } from '../../types/stats';
import type { ReactElement } from 'react';

type Props = {
	value: DateRange;
	onChange: ( next: DateRange ) => void;
};

const ORDER: DateRange[] = [ 'last_7_days', 'last_30_days', 'last_90_days', 'last_365_days' ];

/**
 * Translatable label for one DateRange value.
 *
 * @param value - DateRange to label.
 * @return Localized label.
 */
function label( value: DateRange ): string {
	switch ( value ) {
		case 'last_7_days':
			return __( 'Last 7 days', 'jetpack-videopress-pkg' );
		case 'last_30_days':
			return __( 'Last 30 days', 'jetpack-videopress-pkg' );
		case 'last_90_days':
			return __( 'Last 90 days', 'jetpack-videopress-pkg' );
		case 'last_365_days':
			return __( 'Last 365 days', 'jetpack-videopress-pkg' );
	}
}

/**
 * Header-action date-range pill. Clicking opens a DropdownMenu with the
 * four range presets; selecting one fires `onChange` and dismisses the
 * menu. Rendered in DashboardLayout's `actions` slot from
 * `routes/overview/stage.tsx`.
 *
 * @param props          - Component props.
 * @param props.value    - Currently selected range.
 * @param props.onChange - Called with the next range.
 * @return The pill element.
 */
export default function DateRangeSelector( { value, onChange }: Props ): ReactElement {
	return (
		<DropdownMenu
			icon={ calendar }
			label={ label( value ) }
			text={ label( value ) }
			toggleProps={ { variant: 'secondary', size: 'compact' } }
			controls={ ORDER.map( option => ( {
				title: label( option ),
				isActive: option === value,
				onClick: () => onChange( option ),
			} ) ) }
		/>
	);
}
