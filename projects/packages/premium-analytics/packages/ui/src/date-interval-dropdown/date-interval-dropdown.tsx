/**
 * External dependencies
 */
import { type IntervalType } from '@jetpack-premium-analytics/datetime';
import { DropdownMenu, MenuGroup, MenuItem } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { chartBar, check } from '@wordpress/icons';

import './date-interval-dropdown.scss';

type DateIntervalDropdownProps = {
	/**
	 * The buckets to list, finest first. Derived upstream from the range and, for
	 * a widget that owns its control, from what its chart draws.
	 */
	options: readonly IntervalType[];

	/**
	 * The bucket the widgets are currently drawing.
	 */
	value?: IntervalType;

	/**
	 * Names the trigger, as its tooltip and its accessible name. Defaults to
	 * "Chart interval", plus the active bucket when there is one.
	 */
	label?: string;

	/** Greys the trigger out but keeps it focusable: a passing state, not a missing control. */
	disabled?: boolean;

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
 * Name the trigger for its tooltip and accessible name. It carries the active
 * bucket because the section header subtitle, which used to read it back, is gone.
 */
function getTriggerLabel( value?: IntervalType ): string {
	if ( ! value ) {
		return __( 'Chart interval', 'jetpack-premium-analytics-pkg' );
	}

	return sprintf(
		/* translators: %s: the active chart interval, e.g. "By days". */
		__( 'Chart interval: %s', 'jetpack-premium-analytics-pkg' ),
		getIntervalLabel( value )
	);
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
	disabled = false,
	onChange,
}: DateIntervalDropdownProps ) {
	return (
		<DropdownMenu
			className="date-interval-dropdown"
			icon={ chartBar }
			label={ label ?? getTriggerLabel( value ) }
			popoverProps={ { placement: 'bottom-end' } }
			// An aria-disabled Button drops clicks but not keys, so the arrow shortcut is shut apart.
			disableOpenOnArrowDown={ disabled }
			toggleProps={ {
				className: 'date-interval-dropdown__toggle',
				disabled,
				accessibleWhenDisabled: true,
			} }
		>
			{ ( { onClose } ) => (
				<MenuGroup label={ __( 'Chart interval', 'jetpack-premium-analytics-pkg' ) }>
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
