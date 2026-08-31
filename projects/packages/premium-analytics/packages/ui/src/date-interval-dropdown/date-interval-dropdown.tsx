/**
 * External dependencies
 */
import { type IntervalType } from '@jetpack-premium-analytics/datetime';
import { IconButton, Menu } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { chartBar } from '@wordpress/icons';

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
	 * "Chart interval", plus the active bucket when there is one.
	 */
	label?: string;

	onChange: ( interval: IntervalType ) => void;
};

/**
 * Name a bucket as the menu lists it, under the "Chart intervals" heading.
 */
function getIntervalLabel( interval: IntervalType ): string {
	switch ( interval ) {
		case 'hour':
			return __( 'Hours', 'jetpack-premium-analytics-pkg' );
		case 'day':
			return __( 'Days', 'jetpack-premium-analytics-pkg' );
		case 'week':
			return __( 'Weeks', 'jetpack-premium-analytics-pkg' );
		case 'month':
			return __( 'Months', 'jetpack-premium-analytics-pkg' );
		case 'year':
			return __( 'Years', 'jetpack-premium-analytics-pkg' );
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
		/* translators: %s: the active chart interval, e.g. "Days". */
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
	onChange,
}: DateIntervalDropdownProps ) {
	return (
		<Menu.Root>
			<Menu.Trigger
				render={
					<IconButton
						className="date-interval-dropdown"
						icon={ chartBar }
						label={ label ?? getTriggerLabel( value ) }
						variant="outline"
						tone="neutral"
					/>
				}
			/>
			<Menu.Popup positioner={ <Menu.Positioner align="end" /> }>
				{ /* `null`, not `undefined`: kept controlled, so a bucket the options
				     don't list checks nothing rather than the group keeping its own. */ }
				<Menu.RadioGroup
					value={ value ?? null }
					onValueChange={ ( next: IntervalType ) => onChange( next ) }
				>
					<Menu.GroupLabel>
						{ __( 'Chart intervals', 'jetpack-premium-analytics-pkg' ) }
					</Menu.GroupLabel>
					{ options.map( option => (
						<Menu.RadioItem key={ option } value={ option }>
							<Menu.ItemLabel>{ getIntervalLabel( option ) }</Menu.ItemLabel>
						</Menu.RadioItem>
					) ) }
				</Menu.RadioGroup>
			</Menu.Popup>
		</Menu.Root>
	);
}
