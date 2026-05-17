import { DateRangePicker, formatLabel } from '@automattic/date-range-picker';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { localDateFromYmd, selectionFromDates } from '../range';
import type { PodcastStatsSelection } from '../types';
import type { PresetId } from '@automattic/date-range-picker';
// DateRangeCalendar styles ship with @automattic/ui; load once for the picker.
import '@automattic/ui/style.css';

/**
 * Translated heading for a selection. Preset periods use a fixed label;
 * custom ranges render as "Apr 12 to May 12, 2026".
 *
 * @param selection - Selection.
 * @return          Heading.
 */
export function getPeriodHeading( selection: PodcastStatsSelection ): string {
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
	// 'all' is a 365-day window from the API's cap. Label matches the preset
	// button the user clicks.
	if ( period === 'all' ) {
		return __( 'Last 12 months', 'jetpack-podcast' );
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

// API caps ranges at 365 days, so hide longer presets. Also hide "Custom" —
// the calendar already produces a custom range on direct selection.
const HIDDEN_PRESETS: PresetId[] = [ 'last-3-years', 'custom' ];

const MAX_RANGE_DAYS = 365;

type PeriodControlProps = {
	value: PodcastStatsSelection;
	onChange: ( next: PodcastStatsSelection ) => void;
};

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
	// Match the previous default; the package defaults to 'last-7-days'.
	const defaultFallbackPreset: PresetId = 'last-30-days';
	return (
		<DateRangePicker
			start={ start }
			end={ end }
			onChange={ handleChange }
			locale={ getLocale() }
			hiddenPresets={ HIDDEN_PRESETS }
			disabledBefore={ disabledBefore }
			defaultFallbackPreset={ defaultFallbackPreset }
		/>
	);
};

export default PeriodControl;
