/**
 * External dependencies
 */
import { type DateLimitUpsellCopy, type LockableInterval } from '@jetpack-premium-analytics/data';
import { type IntervalType } from '@jetpack-premium-analytics/datetime';
import { Button, Icon } from '@jetpack-premium-analytics/externals';
import { MenuGroup, MenuItem, NavigableMenu } from '@wordpress/components';
import { useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { check, chevronDown, lock } from '@wordpress/icons';
import clsx from 'clsx';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import { DateControlPopover } from '../date-control-popover';
import { DateLimitUpsell } from '../date-limit-upsell';
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

	/** Buckets listed after `options` with a lock, which cannot be picked. */
	lockedOptions?: readonly LockableInterval[];

	/** Why the locked buckets are locked, shown under the menu; its description is read as each one's. */
	lockUpsell?: DateLimitUpsellCopy;

	/** Buckets listed after `options` that the chart cannot draw as it is set now, which cannot be picked. */
	unavailableOptions?: readonly IntervalType[];

	/** Why the unavailable buckets cannot be picked, shown under the menu and read as each one's description. */
	unavailableHint?: string;

	/**
	 * The bucket the widgets are currently drawing.
	 */
	value?: IntervalType;

	/**
	 * The trigger's tooltip and the menu's name: "Chart interval", plus the active bucket if
	 * any, by default. An openable trigger is named by its visible bucket; a lone bucket keeps
	 * this as its accessible name.
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
 * Name the trigger for its tooltip. It carries the active bucket because the
 * section header subtitle, which used to read it back, is gone.
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
 * The chart bucket-size control: a menu of what the active range allows, what the chart cannot
 * draw as it is set now, and what the plan locks.
 *
 * The trigger names the active bucket, not a glyph a widget's "Bar chart" toggle would echo, and
 * is disabled with one option and none unavailable or locked.
 */
export function DateIntervalDropdown( {
	options,
	lockedOptions = [],
	lockUpsell,
	unavailableOptions = [],
	unavailableHint,
	value,
	label,
	disabled = false,
	triggerProps,
	onChange,
}: DateIntervalDropdownProps ) {
	const triggerLabel = label ?? getTriggerLabel( value );
	const [ isOpen, setIsOpen ] = useState( false );
	const onKeyDown = openOnArrowDown( { isOpen, onToggle: () => setIsOpen( true ), disabled } );
	const lockDescriptionId = useInstanceId(
		DateIntervalDropdown,
		'date-interval-dropdown__lock-description'
	);
	const unavailableHintId = useInstanceId(
		DateIntervalDropdown,
		'date-interval-dropdown__unavailable-hint'
	);

	// The trigger's own Button, so the lone bucket sits where the menu's trigger would.
	if (
		value &&
		options.length === 1 &&
		options[ 0 ] === value &&
		! lockedOptions.length &&
		! unavailableOptions.length
	) {
		return (
			<Button
				variant="minimal"
				tone="neutral"
				size={ triggerProps?.size }
				className={ clsx( 'date-interval-dropdown__lone', triggerProps?.className ) }
				aria-label={ triggerLabel }
				disabled
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
			tooltip={ triggerLabel }
			trigger={
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
					{ unavailableOptions.map( option => (
						<MenuItem
							key={ option }
							role="menuitemradio"
							isSelected={ false }
							disabled
							aria-describedby={ unavailableHint ? unavailableHintId : undefined }
						>
							{ getIntervalLabel( option ) }
						</MenuItem>
					) ) }
					{ lockedOptions.map( option => (
						<MenuItem
							key={ option }
							role="menuitemradio"
							isSelected={ false }
							icon={ lock }
							disabled
							aria-describedby={ lockUpsell ? lockDescriptionId : undefined }
						>
							{ getIntervalLabel( option ) }
						</MenuItem>
					) ) }
				</MenuGroup>
			</NavigableMenu>

			{ unavailableOptions.length > 0 && unavailableHint && (
				<p id={ unavailableHintId } className="date-interval-dropdown__unavailable-hint">
					{ unavailableHint }
				</p>
			) }

			{ lockedOptions.length > 0 && lockUpsell && (
				<div className="date-interval-dropdown__lock-notice">
					<DateLimitUpsell upsell={ lockUpsell } descriptionId={ lockDescriptionId } />
				</div>
			) }
		</DateControlPopover>
	);
}
