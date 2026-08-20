/**
 * External dependencies
 */
import { INTERVAL_TYPES, type IntervalType } from '@jetpack-premium-analytics/datetime';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { chartBar, check } from '@wordpress/icons';

import './date-interval-dropdown.scss';

type DateIntervalDropdownProps = {
	/**
	 * The buckets the active range allows. Derived from the range rather than
	 * fixed: the rest of the menu is listed disabled, so the range decides what
	 * can be picked without deciding what can be seen.
	 */
	allowed: readonly IntervalType[];

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
		case 'quarter':
			return __( 'By quarters', 'jetpack-premium-analytics-pkg' );
		case 'year':
			return __( 'By years', 'jetpack-premium-analytics-pkg' );
	}
}

/**
 * The bucket size every chart on the page draws, as a glyph opening a menu of
 * every bucket — the ones the active range cannot fill listed disabled.
 *
 * The glyph is a chart rather than a clock: the control buckets what the charts
 * draw, it does not narrow the period the rest of the surface reports on.
 *
 * Listing the whole set keeps the menu a fixed shape, so a bucket the range
 * disallows reads as unavailable here rather than as absent from the product,
 * and moving the range shows which buckets that bought. The trigger carries no
 * text, so the menu is also the only place the choice can be inspected; the
 * section header's subtitle names the active bucket.
 */
export function DateIntervalDropdown( {
	allowed,
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
					{ INTERVAL_TYPES.map( option => {
						const isAllowed = allowed.includes( option );
						// A disallowed bucket is never the selection, even transiently:
						// checking a disabled item would name a bucket the charts
						// cannot be drawing.
						const isSelected = isAllowed && option === value;

						return (
							<MenuItem
								key={ option }
								role="menuitemradio"
								isSelected={ isSelected }
								disabled={ ! isAllowed }
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
