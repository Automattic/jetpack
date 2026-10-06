/**
 * External dependencies
 */
import { type IntervalType } from '@jetpack-premium-analytics/datetime';
import { Button, Icon, IconButton } from '@jetpack-premium-analytics/externals';
import { MenuGroup, MenuItem, NavigableMenu } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { chartBar, check, chevronDown } from '@wordpress/icons';
import clsx from 'clsx';
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
import './date-interval-dropdown.scss';

type DateIntervalDropdownProps = {
	/**
	 * The buckets to list, default first. Derived upstream from the range and, for
	 * a widget that owns its control, from what its chart draws.
	 */
	options: readonly IntervalType[];

	/**
	 * The bucket the widgets are currently drawing.
	 */
	value?: IntervalType;

	/**
	 * Names the trigger, as its tooltip and its accessible name. Defaults to
	 * "Chart interval", plus the active bucket when there is one. With
	 * `withLabel`, the visible bucket names it and this is only the tooltip.
	 */
	label?: string;

	/**
	 * Names the active bucket on the trigger instead of the glyph, which a widget
	 * header would confuse with its "Bar chart" toggle.
	 */
	withLabel?: boolean;

	/** Greys the trigger out but keeps it focusable: a passing state, not a missing control. */
	disabled?: boolean;

	/** The trigger's look, over a neutral outline at the default size. */
	triggerProps?: DateControlTriggerProps;

	onChange: ( interval: IntervalType ) => void;
};

/**
 * Name a bucket as the menu lists it.
 *
 * @param interval - The bucket.
 * @return Its label, such as "By days".
 */
export function getIntervalLabel( interval: IntervalType ): string {
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
 * The chart bucket-size control: a menu of what the active range allows.
 *
 * The glyph trigger (not a clock: it buckets the charts, doesn't narrow the period) opens
 * even with one option. With `withLabel` it names the bucket, and is disabled with one.
 */
export function DateIntervalDropdown( {
	options,
	value,
	label,
	withLabel = false,
	disabled = false,
	triggerProps,
	onChange,
}: DateIntervalDropdownProps ) {
	const triggerLabel = label ?? getTriggerLabel( value );
	const [ isOpen, setIsOpen ] = useState( false );
	const onKeyDown = openOnArrowDown( { isOpen, onToggle: () => setIsOpen( true ), disabled } );

	// The trigger's own Button, so the lone bucket sits where the menu's trigger would.
	if ( withLabel && value && options.length === 1 && options[ 0 ] === value ) {
		return (
			<Button
				variant="minimal"
				tone="neutral"
				size={ triggerProps?.size }
				className={ clsx( 'date-interval-dropdown__lone', triggerProps?.className ) }
				aria-label={ triggerLabel }
				disabled
				focusableWhenDisabled={ false }
			>
				<span className="date-interval-dropdown__label">{ getIntervalLabel( value ) }</span>
			</Button>
		);
	}

	return (
		<DateControlPopover
			align="end"
			title={ triggerLabel }
			open={ isOpen }
			onOpenChange={ setIsOpen }
			tooltip={ withLabel ? triggerLabel : undefined }
			trigger={
				withLabel ? (
					<Button
						{ ...DATE_CONTROL_TRIGGER_DEFAULTS }
						{ ...triggerProps }
						disabled={ disabled }
						onKeyDown={ onKeyDown }
					>
						<span className="date-interval-dropdown__label">
							{ value ? getIntervalLabel( value ) : triggerLabel }
						</span>
						<Icon className="date-interval-dropdown__caret" icon={ chevronDown } size={ 18 } />
					</Button>
				) : (
					<IconButton
						{ ...DATE_CONTROL_TRIGGER_DEFAULTS }
						{ ...triggerProps }
						icon={ chartBar }
						label={ triggerLabel }
						disabled={ disabled }
						onKeyDown={ onKeyDown }
					/>
				)
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
