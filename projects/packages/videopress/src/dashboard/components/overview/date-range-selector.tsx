import { Dropdown, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import { Button } from '@wordpress/ui';
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
 * Header-action date-range pill. Clicking opens a menu with the four
 * range presets; selecting one fires `onChange` and dismisses the menu.
 * Rendered in DashboardLayout's `actions` slot from
 * `routes/overview/stage.tsx`.
 *
 * The toggle is a `@wordpress/ui` Button in `tone="neutral"` so the
 * styling matches Backup's overview filter row (`<Button variant="outline"
 * tone="neutral">`). `@wordpress/components`'s `DropdownMenu` wraps a
 * Button whose `variant` axis has no `neutral` option, so we fall back
 * to the lower-level `<Dropdown>` primitive and render a custom toggle.
 *
 * @param props          - Component props.
 * @param props.value    - Currently selected range.
 * @param props.onChange - Called with the next range.
 * @return The pill element.
 */
export default function DateRangeSelector( { value, onChange }: Props ): ReactElement {
	return (
		<Dropdown
			renderToggle={ ( { isOpen, onToggle } ) => (
				<Button
					variant="outline"
					tone="neutral"
					onClick={ onToggle }
					aria-expanded={ isOpen }
					aria-haspopup="menu"
				>
					<Button.Icon icon={ calendar } />
					{ label( value ) }
				</Button>
			) }
			renderContent={ ( { onClose } ) => (
				<MenuGroup>
					{ ORDER.map( option => (
						<MenuItem
							key={ option }
							isSelected={ option === value }
							onClick={ () => {
								onChange( option );
								onClose();
							} }
						>
							{ label( option ) }
						</MenuItem>
					) ) }
				</MenuGroup>
			) }
		/>
	);
}
