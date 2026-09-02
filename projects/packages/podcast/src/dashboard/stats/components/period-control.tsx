import { useViewportMatch } from '@wordpress/compose';
import { useCallback, useMemo, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { calendar as calendarIcon } from '@wordpress/icons';
import { Button, Popover, RangeCalendar } from '@wordpress/ui';
import { localDateFromYmd, selectionFromDates } from '../range';
import type { PodcastStatsSelection } from '../types';
import type { MouseEvent } from 'react';

type DateRange = NonNullable< Parameters< typeof RangeCalendar >[ 0 ][ 'value' ] >;

const MAX_RANGE_DAYS = 365;

const getLocale = () => {
	if ( typeof document !== 'undefined' ) {
		const htmlLang = document.documentElement.lang;
		if ( htmlLang ) {
			return htmlLang;
		}
	}
	if ( typeof navigator !== 'undefined' && navigator.language ) {
		return navigator.language;
	}
	return 'en-US';
};

const formatLabel = ( start: Date, end: Date ) => {
	const format = ( date: Date ) => {
		try {
			return new Intl.DateTimeFormat( getLocale(), { dateStyle: 'medium' } ).format( date );
		} catch {
			return new Intl.DateTimeFormat( 'en-US', { dateStyle: 'medium' } ).format( date );
		}
	};
	return sprintf(
		/* translators: %1$s: start date, %2$s: end date */
		__( '%1$s to %2$s', 'jetpack-podcast' ),
		format( start ),
		format( end )
	);
};

/**
 * Translated heading for a selection. Preset periods use a fixed label;
 * custom ranges render as "Apr 12 to May 12, 2026".
 *
 * The 'all' preset differs by surface: the show view has a true lifetime total
 * ("All time"), while the episode view tops out at the API's 365-day cap
 * ("Last 12 months").
 *
 * @param selection - Selection.
 * @param scope     - 'show' has an all-time total; 'episode' maxes at 365 days.
 * @return          Heading.
 */
export function getPeriodHeading(
	selection: PodcastStatsSelection,
	scope: 'show' | 'episode' = 'show'
): string {
	const { period, range } = selection;
	if ( period === '7d' ) {
		return __( 'Last 7 days', 'jetpack-podcast' );
	}
	if ( period === '30d' ) {
		return __( 'Last 30 days', 'jetpack-podcast' );
	}
	if ( period === '90d' ) {
		return __( 'Last 90 days', 'jetpack-podcast' );
	}
	if ( period === 'all' ) {
		return scope === 'episode'
			? __( 'Last 12 months', 'jetpack-podcast' )
			: __( 'All time', 'jetpack-podcast' );
	}
	return formatLabel( localDateFromYmd( range.from ), localDateFromYmd( range.to ) );
}

const startOfToday = () => {
	const today = new Date();
	today.setHours( 0, 0, 0, 0 );
	return today;
};

const daysAgo = ( days: number ) => {
	const date = startOfToday();
	date.setDate( date.getDate() - days );
	return date;
};

type Preset = { label: string; range: () => { start: Date; end: Date } };

// "Last 12 months" is 365 days so it round-trips to the 'all' period.
const getPresets = (): Preset[] => [
	{
		label: __( 'Today', 'jetpack-podcast' ),
		range: () => ( { start: startOfToday(), end: startOfToday() } ),
	},
	{
		label: __( 'Yesterday', 'jetpack-podcast' ),
		range: () => ( { start: daysAgo( 1 ), end: daysAgo( 1 ) } ),
	},
	{
		label: __( 'Last 7 days', 'jetpack-podcast' ),
		range: () => ( { start: daysAgo( 6 ), end: startOfToday() } ),
	},
	{
		label: __( 'Last 30 days', 'jetpack-podcast' ),
		range: () => ( { start: daysAgo( 29 ), end: startOfToday() } ),
	},
	{
		label: __( 'Last 90 days', 'jetpack-podcast' ),
		range: () => ( { start: daysAgo( 89 ), end: startOfToday() } ),
	},
	{
		label: __( 'Month to date', 'jetpack-podcast' ),
		range: () => {
			const today = startOfToday();
			return { start: new Date( today.getFullYear(), today.getMonth(), 1 ), end: today };
		},
	},
	{
		label: __( 'Last 12 months', 'jetpack-podcast' ),
		range: () => ( { start: daysAgo( MAX_RANGE_DAYS - 1 ), end: startOfToday() } ),
	},
	{
		label: __( 'Year to date', 'jetpack-podcast' ),
		range: () => {
			const today = startOfToday();
			return { start: new Date( today.getFullYear(), 0, 1 ), end: today };
		},
	},
];

const isSameRange = ( a: PodcastStatsSelection, b: PodcastStatsSelection ) =>
	a.range.from === b.range.from && a.range.to === b.range.to;

type PeriodControlProps = {
	value: PodcastStatsSelection;
	onChange: ( next: PodcastStatsSelection ) => void;
};

const PeriodControl = ( { value, onChange }: PeriodControlProps ) => {
	const [ isOpen, setIsOpen ] = useState( false );
	const [ draft, setDraft ] = useState< DateRange | null >( null );
	const isSmall = useViewportMatch( 'medium', '<' );

	const start = localDateFromYmd( value.range.from );
	const end = localDateFromYmd( value.range.to );
	const today = startOfToday();
	const earliest = daysAgo( MAX_RANGE_DAYS - 1 );

	const apply = useCallback(
		( next: PodcastStatsSelection ) => {
			onChange( next );
			setIsOpen( false );
		},
		[ onChange ]
	);

	const handleOpenChange = useCallback(
		( open: boolean ) => {
			setDraft( open ? { from: start, to: end } : null );
			setIsOpen( open );
		},
		[ start, end ]
	);

	// First click after a complete range starts over; the second click applies.
	const handleCalendarChange = useCallback(
		( next: DateRange | null, triggerDate: Date ) => {
			if ( ! draft?.from || draft.to ) {
				setDraft( { from: triggerDate } );
				return;
			}
			if ( next?.from && next?.to ) {
				apply( selectionFromDates( next.from, next.to ) );
			}
		},
		[ draft, apply ]
	);

	const presets = useMemo( getPresets, [] );
	const handlePresetClick = useCallback(
		( event: MouseEvent< HTMLButtonElement > ) => {
			const preset = presets[ Number( event.currentTarget.dataset.index ) ];
			if ( preset ) {
				const { start: presetStart, end: presetEnd } = preset.range();
				apply( selectionFromDates( presetStart, presetEnd ) );
			}
		},
		[ presets, apply ]
	);
	// Show the two months ending at the selection so the picked range is in view.
	const endMonth = draft?.to ?? draft?.from ?? end;
	const defaultMonth = new Date(
		endMonth.getFullYear(),
		endMonth.getMonth() - ( isSmall ? 0 : 1 ),
		1
	);

	return (
		<Popover.Root open={ isOpen } onOpenChange={ handleOpenChange }>
			<Popover.Trigger
				render={ <Button variant="outline" tone="neutral" /> }
				aria-label={ sprintf(
					/* translators: %s: selected date range */
					__( 'Date range: %s. Activate to open calendar.', 'jetpack-podcast' ),
					formatLabel( start, end )
				) }
			>
				{ formatLabel( start, end ) }
				<Button.Icon icon={ calendarIcon } />
			</Popover.Trigger>
			<Popover.Popup
				className="podcast-period-control__popup"
				positioner={ <Popover.Positioner align="end" sideOffset={ 8 } /> }
			>
				<div className="podcast-period-control__body">
					<ul
						className="podcast-period-control__presets"
						aria-label={ __( 'Date range presets', 'jetpack-podcast' ) }
					>
						{ presets.map( ( preset, index ) => {
							const { start: presetStart, end: presetEnd } = preset.range();
							const isActive = isSameRange( selectionFromDates( presetStart, presetEnd ), value );
							return (
								<li key={ preset.label }>
									<Button
										variant={ isActive ? 'solid' : 'minimal' }
										tone={ isActive ? 'brand' : 'neutral' }
										aria-pressed={ isActive }
										className="podcast-period-control__preset"
										data-index={ index }
										onClick={ handlePresetClick }
									>
										{ preset.label }
									</Button>
								</li>
							);
						} ) }
					</ul>
					<RangeCalendar
						value={ draft }
						onValueChange={ handleCalendarChange }
						locale={ getLocale() }
						numberOfMonths={ isSmall ? 1 : 2 }
						defaultMonth={ defaultMonth }
						startMonth={ earliest }
						endMonth={ today }
						disabled={ [ { before: earliest }, { after: today } ] }
					/>
				</div>
			</Popover.Popup>
		</Popover.Root>
	);
};

export default PeriodControl;
