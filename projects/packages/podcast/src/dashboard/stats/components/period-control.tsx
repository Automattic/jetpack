import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { localDateFromYmd, selectionFromDates } from '../range';
import { DateRangePicker } from './date-range-picker';
import { formatLabel } from './date-range-picker/utils';
import type { PodcastStatsSelection } from '../types';
import type { PresetId } from './date-range-picker/utils';

// Episode endpoint has no all-time variant — show "Last year" in that scope.
export type PeriodScope = 'show' | 'episode';

/**
 * Translated heading for a selection. Preset periods use a fixed label;
 * custom ranges render as "Apr 12 to May 12, 2026".
 *
 * @param selection - Selection.
 * @param scope     - Show or episode scope.
 * @return          Heading.
 */
export function getPeriodHeading(
	selection: PodcastStatsSelection,
	scope: PeriodScope = 'show'
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
			? __( 'Last year', 'jetpack-podcast' )
			: __( 'All time', 'jetpack-podcast' );
	}
	return formatLabel( localDateFromYmd( range.from ), localDateFromYmd( range.to ), getLocale() );
}

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

type PeriodControlProps = {
	value: PodcastStatsSelection;
	onChange: ( next: PodcastStatsSelection ) => void;
};

// The podcast stats summary endpoint caps requested ranges at 365 days. Hide
// presets that would exceed that cap, plus the redundant "Custom" listbox row
// (picking dates on the calendar already produces a custom range).
const HIDDEN_PRESETS: PresetId[] = [ 'last-3-years', 'all-time', 'custom' ];

const MAX_RANGE_DAYS = 365;

const PeriodControl = ( { value, onChange }: PeriodControlProps ) => {
	const start = localDateFromYmd( value.range.from );
	const end = localDateFromYmd( value.range.to );
	const handleChange = useCallback(
		( next: { start: Date; end: Date } ) => onChange( selectionFromDates( next.start, next.end ) ),
		[ onChange ]
	);
	const disabledBefore = new Date();
	disabledBefore.setHours( 0, 0, 0, 0 );
	disabledBefore.setDate( disabledBefore.getDate() - ( MAX_RANGE_DAYS - 1 ) );
	return (
		<DateRangePicker
			start={ start }
			end={ end }
			onChange={ handleChange }
			locale={ getLocale() }
			hiddenPresets={ HIDDEN_PRESETS }
			disabledBefore={ disabledBefore }
		/>
	);
};

export default PeriodControl;
