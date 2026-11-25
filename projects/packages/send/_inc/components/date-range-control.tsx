import { useViewportMatch } from '@wordpress/compose';
import { getSettings } from '@wordpress/date';
import { useCallback, useMemo, useRef, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import { Button, Popover, RangeCalendar, Stack, Text, VisuallyHidden } from '@wordpress/ui';
import {
	calendarLocale,
	daysBetween,
	formatCount,
	localDay,
	siteToday,
	ymdOf,
} from '../data/dates';
import { periodKey, periodLabel, presetDays } from '../data/period';
import type { Period, PeriodPreset } from '../data/types';
import type { MouseEvent, ReactNode } from 'react';
import './date-range-control.scss';

type DateRange = NonNullable< Parameters< typeof RangeCalendar >[ 0 ][ 'value' ] >;

export type DateRangeControlProps = {
	/** Null is "Any date", offered only with `allowAny`. */
	value: Period | null;
	onChange: ( next: Period | null ) => void;
	presets: PeriodPreset[];
	/** Offer "Any date" first (the Log). */
	allowAny?: boolean;
	/** The first day that can be picked, site-local `Y-m-d`. */
	earliest: string;
	/** The longest custom span, in days; the dashboard passes 365. */
	maxDays?: number;
	/** Shown under the presets, e.g. how long the log keeps emails. */
	note?: ReactNode;
	/** The popover's alignment to the button. */
	align?: 'start' | 'end';
	/** The popover's hidden title. */
	title?: string;
	/** Site-local today, `Y-m-d`; defaults to the site's. */
	today?: string;
};

/**
 * The calendar's starting draft: the value's days. The last 24 hours and Any date start empty,
 * because the rolling day spans two calendar days and Apply would turn it into custom dates.
 *
 * @param value - The current period.
 * @param today - Site-local today.
 * @return The draft, or null.
 */
function seedDraft( value: Period | null, today: string ): DateRange | null {
	if ( ! value || ( 'range' in value && value.range === 1 ) ) {
		return null;
	}
	const { start, end } = 'range' in value ? presetDays( value.range, today ) : value;
	return { from: localDay( start ), to: localDay( end ) };
}

/**
 * The date button and its popover: presets that apply at once, then a calendar for custom days
 * that applies on Apply. Shared by the Log and the dashboard.
 *
 * @param props          - Component props.
 * @param props.value    - The period, or null for any date.
 * @param props.onChange - Called with the new period.
 * @param props.presets  - Presets to offer.
 * @param props.allowAny - Offer "Any date".
 * @param props.earliest - First pickable day.
 * @param props.maxDays  - Longest custom span in days.
 * @param props.note     - A line under the presets.
 * @param props.align    - Popover alignment.
 * @param props.title    - The popover's hidden title.
 * @param props.today    - Site-local today.
 * @return The control.
 */
export const DateRangeControl = ( {
	value,
	onChange,
	presets,
	allowAny = false,
	earliest,
	maxDays = 0,
	note,
	align = 'end',
	title,
	today: todayProp,
}: DateRangeControlProps ) => {
	const narrow = useViewportMatch( 'medium', '<' );
	const today = todayProp ?? siteToday();
	const first = earliest && earliest < today ? earliest : today;
	const [ open, setOpen ] = useState( false );
	const [ draft, setDraft ] = useState< DateRange | null >( null );
	const focusRef = useRef< HTMLButtonElement >( null );

	const onOpenChange = useCallback(
		( next: boolean ) => {
			if ( next ) {
				setDraft( seedDraft( value, today ) );
			}
			setOpen( next );
		},
		[ value, today ]
	);

	const pick = useCallback(
		( next: Period | null ) => {
			setOpen( false );
			onChange( next );
		},
		[ onChange ]
	);

	const choices = useMemo(
		() => [ ...( allowAny ? [ null ] : [] ), ...presets.map( ( range ): Period => ( { range } ) ) ],
		[ allowAny, presets ]
	);
	const isActive = ( choice: Period | null ) =>
		choice === null
			? value === null
			: !! value && 'range' in value && 'range' in choice && value.range === choice.range;
	const focusIndex = Math.max( 0, choices.findIndex( isActive ) );

	const picked = useMemo(
		() =>
			draft?.from && draft?.to ? { start: ymdOf( draft.from ), end: ymdOf( draft.to ) } : null,
		[ draft ]
	);
	const span = picked ? daysBetween( picked.start, picked.end ) + 1 : 0;
	const tooLong = maxDays > 0 && span > maxDays;
	let draftText: string = __( 'Pick a start date', 'jetpack-send-pkg' );
	if ( picked && tooLong ) {
		draftText = sprintf(
			/* translators: %s: the longest range in days, e.g. 365. */
			__( 'Pick a range of %s days or less.', 'jetpack-send-pkg' ),
			formatCount( maxDays )
		);
	} else if ( picked ) {
		draftText = sprintf(
			/* translators: 1: the picked days, e.g. "Sep 1 – Oct 19", 2: how many days. */
			_n( '%1$s · %2$s day', '%1$s · %2$s days', span, 'jetpack-send-pkg' ),
			periodLabel( picked, today ),
			formatCount( span )
		);
	} else if ( draft?.from ) {
		draftText = __( 'Pick an end date', 'jetpack-send-pkg' );
	}

	const apply = useCallback( () => {
		if ( ! picked || tooLong ) {
			return;
		}
		// Unchanged preset days stay the preset, so the label and the URL keep its name.
		const preset = presets.find( range => {
			const days = presetDays( range, today );
			return range > 1 && days.start === picked.start && days.end === picked.end;
		} );
		pick( preset ? { range: preset } : picked );
	}, [ picked, tooLong, presets, today, pick ] );

	const onPreset = useCallback(
		( event: MouseEvent< HTMLButtonElement > ) => {
			const index = Number( event.currentTarget.dataset.index );
			if ( index >= 0 && index < choices.length ) {
				pick( choices[ index ] );
			}
		},
		[ choices, pick ]
	);

	const disabled = useMemo(
		() => [ { before: localDay( first ) }, { after: localDay( today ) } ],
		[ first, today ]
	);
	const startOfWeek = getSettings().l10n?.startOfWeek;

	// In the Log a set period is a filter, so it turns brand like DataViews' chips with a value.
	const filtering = allowAny && value !== null;

	return (
		<Popover.Root open={ open } onOpenChange={ onOpenChange }>
			<Popover.Trigger
				render={
					<Button variant="outline" tone={ filtering ? 'brand' : 'neutral' } size="compact" />
				}
			>
				<Button.Icon icon={ calendar } />
				<VisuallyHidden render={ <span /> }>
					{ __( 'Date range:', 'jetpack-send-pkg' ) }
				</VisuallyHidden>{ ' ' }
				{ periodLabel( value, today ) }
			</Popover.Trigger>
			<Popover.Popup
				positioner={ <Popover.Positioner align={ align } /> }
				initialFocus={ focusRef }
				className="jetpack-send-range"
			>
				<VisuallyHidden render={ <Popover.Title /> }>
					{ title ?? __( 'Date range', 'jetpack-send-pkg' ) }
				</VisuallyHidden>
				<Stack direction={ narrow ? 'column' : 'row' } gap="lg" align="start">
					<Stack direction="column" gap="md">
						<Stack
							direction="column"
							align="stretch"
							role="group"
							aria-label={ __( 'Quick ranges', 'jetpack-send-pkg' ) }
						>
							{ choices.map( ( choice, index ) => (
								<Button
									key={ choice ? periodKey( choice ) : 'any' }
									ref={ index === focusIndex ? focusRef : undefined }
									variant="minimal"
									tone="neutral"
									size="compact"
									aria-pressed={ isActive( choice ) }
									className="jetpack-send-range__preset"
									data-index={ index }
									onClick={ onPreset }
								>
									{ periodLabel( choice, today ) }
								</Button>
							) ) }
						</Stack>
						{ note && (
							<Text variant="body-md" className="jetpack-send-muted jetpack-send-range__note">
								{ note }
							</Text>
						) }
					</Stack>
					<Stack direction="column" gap="md">
						<RangeCalendar
							value={ draft }
							onValueChange={ setDraft }
							defaultMonth={ draft?.to ?? draft?.from ?? localDay( today ) }
							numberOfMonths={ narrow ? 1 : 2 }
							startMonth={ localDay( first ) }
							endMonth={ localDay( today ) }
							disabled={ disabled }
							max={ maxDays > 0 ? maxDays - 1 : undefined }
							locale={ calendarLocale() }
							weekStartsOn={ startOfWeek }
						/>
						<Text variant="body-md" aria-live="polite" className="jetpack-send-muted">
							{ draftText }
						</Text>
						<Stack direction="row" justify="flex-end" gap="sm">
							<Popover.Close render={ <Button variant="minimal" tone="neutral" size="compact" /> }>
								{ __( 'Cancel', 'jetpack-send-pkg' ) }
							</Popover.Close>
							<Button size="compact" disabled={ ! picked || tooLong } onClick={ apply }>
								{ __( 'Apply', 'jetpack-send-pkg' ) }
							</Button>
						</Stack>
					</Stack>
				</Stack>
			</Popover.Popup>
		</Popover.Root>
	);
};

export default DateRangeControl;
