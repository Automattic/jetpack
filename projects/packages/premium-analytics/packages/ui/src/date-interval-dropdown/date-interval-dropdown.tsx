/**
 * External dependencies
 */
import { type IntervalType } from '@jetpack-premium-analytics/datetime';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chartBar, check } from '@wordpress/icons';

import './date-interval-dropdown.scss';

type DateIntervalDropdownProps = {
	/**
	 * The buckets the active range allows, finest first. Derived from the range
	 * rather than fixed, so the menu can never offer one the range would coerce
	 * away.
	 */
	options: readonly IntervalType[];

	/**
	 * The bucket the widgets are currently drawing.
	 */
	value?: IntervalType;

	/**
	 * Names the trigger, as its tooltip and its accessible name. Defaults to
	 * "Chart interval".
	 */
	label?: string;

	onChange: ( interval: IntervalType ) => void;
};

/**
 * Name a bucket as the menu lists it.
 */
function getIntervalLabel( interval: IntervalType ): string {
	switch ( interval ) {
		case 'hour':
			return __( 'By hours', 'jetpack-premium-analytics-pkg' );
		case 'day':
			return __( 'By days', 'jetpack-premium-analytics-pkg' );
		case 'week':
			return __( 'By weeks', 'jetpack-premium-analytics-pkg' );
		case 'month':
			return __( 'By months', 'jetpack-premium-analytics-pkg' );
		case 'year':
			return __( 'By years', 'jetpack-premium-analytics-pkg' );
	}
}

/**
 * The bucket size every chart draws, as a glyph (not a clock — it buckets the
 * charts, doesn't narrow the reported period) opening a menu of what the
 * active range allows. Opens even with one option, since the trigger has no text.
 */
export function DateIntervalDropdown( {
	options,
	value,
	label,
	onChange,
}: DateIntervalDropdownProps ) {
	return (
		<DropdownMenu
			className="date-interval-dropdown"
			icon={ chartBar }
			label={ label ?? __( 'Chart interval', 'jetpack-premium-analytics-pkg' ) }
			popoverProps={ { placement: 'bottom-end' } }
			toggleProps={ { className: 'date-interval-dropdown__toggle' } }
		>
			{ ( { onClose } ) => (
				<MenuGroup>
					{ options.map( option => {
						const isSelected = option === value;

						return (
							<MenuItem
								key={ option }
								role="menuitemradio"
								isSelected={ isSelected }
								icon={ isSelected ? check : undefined }
								onClick={ () => {
									onChange( option );
									onClose();
								} }
							>
								{ getIntervalLabel( option ) }
							</MenuItem>
						);
					} ) }
				</MenuGroup>
			) }
		</DropdownMenu>
	);
}
