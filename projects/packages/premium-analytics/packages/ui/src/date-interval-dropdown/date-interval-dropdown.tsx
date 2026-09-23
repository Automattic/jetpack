/**
 * External dependencies
 */
import { type IntervalType } from '@jetpack-premium-analytics/datetime';
import { IconButton } from '@jetpack-premium-analytics/externals';
import { MenuGroup, MenuItem, NavigableMenu } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { chartBar, check } from '@wordpress/icons';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { DateControlPopover } from '../date-control-popover';
import {
	DATE_CONTROL_TRIGGER_DEFAULTS,
	openOnArrowDown,
	type DateControlTriggerProps,
} from '../utils/date-control-trigger';

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

	/** The trigger's look, over a neutral outline at the default size. */
	triggerProps?: DateControlTriggerProps;

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
	triggerProps,
	onChange,
}: DateIntervalDropdownProps ) {
	const triggerLabel = label ?? getTriggerLabel( value );
	const [ isOpen, setIsOpen ] = useState( false );

	return (
		<DateControlPopover
			align="end"
			title={ triggerLabel }
			open={ isOpen }
			onOpenChange={ setIsOpen }
			trigger={
				<IconButton
					{ ...DATE_CONTROL_TRIGGER_DEFAULTS }
					{ ...triggerProps }
					icon={ chartBar }
					label={ triggerLabel }
					disabled={ disabled }
					onKeyDown={ openOnArrowDown( { isOpen, onToggle: () => setIsOpen( true ), disabled } ) }
					aria-haspopup="true"
				/>
			}
		>
			<NavigableMenu role="menu" aria-label={ triggerLabel }>
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
									setIsOpen( false );
								} }
							>
								{ getIntervalLabel( option ) }
							</MenuItem>
						);
					} ) }
				</MenuGroup>
			</NavigableMenu>
		</DateControlPopover>
	);
}
