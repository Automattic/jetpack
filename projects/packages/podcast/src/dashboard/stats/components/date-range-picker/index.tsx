/**
 * Date-range picker for podcast Stats. Mirrors the activity-log port of
 * Calypso's `client/dashboard/components/date-range-picker/index.tsx`,
 * dropping the disabled-toggle path (paid-tier upsell affordance) that
 * the activity log uses.
 */
import { Dropdown, Tooltip, Button } from '@wordpress/components';
import { useMediaQuery, useInstanceId } from '@wordpress/compose';
import { __, sprintf } from '@wordpress/i18n';
import { calendar } from '@wordpress/icons';
import { useMemo, useState } from 'react';
import { DateRangeContent } from './date-range-content';
import { parseYmdLocal, formatYmd, formatSiteYmd } from './datetime';
import { formatLabel } from './utils';
import type { PresetId } from './utils';
import './style.scss';

// `@automattic/ui`'s `DateRangeCalendar` styling lives in its own
// stylesheet — import it so the calendar renders with the Calypso-style
// day numbers instead of wp-admin's default button boxes.
import '@automattic/ui/style.css';

type DateRangePickerProps = {
	start: Date;
	end: Date;
	onChange: ( next: { start: Date; end: Date } ) => void;
	timezoneString?: string;
	gmtOffset?: number;
	locale: string;
	disableFuture?: boolean;
	disabledBefore?: Date;
	defaultFallbackPreset?: PresetId;
	hiddenPresets?: PresetId[];
	inputsProps?: {
		onStartFocus?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
		onEndFocus?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
		onStartBlur?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
		onEndBlur?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
	};
};

/**
 * Render the date-range picker.
 *
 * @param props                       - Props.
 * @param props.start
 * @param props.end
 * @param props.onChange
 * @param props.gmtOffset
 * @param props.timezoneString
 * @param props.locale
 * @param props.disableFuture
 * @param props.disabledBefore
 * @param props.defaultFallbackPreset
 * @param props.hiddenPresets
 * @param props.inputsProps
 * @return      Element.
 */
export function DateRangePicker( {
	start,
	end,
	onChange,
	gmtOffset,
	timezoneString,
	locale,
	disableFuture = true,
	disabledBefore,
	defaultFallbackPreset = 'last-30-days',
	hiddenPresets,
	inputsProps,
}: DateRangePickerProps ) {
	const isSmall = useMediaQuery( '(max-width: 600px)' );
	const showTwoMonths = useMediaQuery( '(min-width: 900px)' );
	const instanceId = useInstanceId( DateRangePicker, 'daterange' );
	const mobileLabelId = `presets-label-${ instanceId }-mobile`;
	const desktopLabelId = `presets-label-${ instanceId }-desktop`;

	const label = formatLabel( start, end, locale );

	const resetKey = [
		formatSiteYmd( start ),
		formatSiteYmd( end ),
		timezoneString ?? '',
		gmtOffset ?? '',
	].join( '|' );

	return (
		<Dropdown
			popoverProps={ { className: 'daterange-popover' } }
			renderToggle={ ( { onToggle, isOpen } ) => (
				<Tooltip text={ __( 'Select a date range', 'jetpack-podcast' ) } placement="top">
					<div className="daterange-input__toggle">
						<Button
							type="button"
							variant="tertiary"
							onClick={ onToggle }
							aria-haspopup="dialog"
							aria-expanded={ isOpen }
							aria-label={ sprintf(
								/* translators: %s: date range label */
								__( 'Date range: %s. Activate to open calendar.', 'jetpack-podcast' ),
								label
							) }
							className="daterange-input__field"
							icon={ calendar }
							iconPosition="right"
						>
							<span aria-hidden="true" className="daterange-input__text">
								{ label }
							</span>
						</Button>
					</div>
				</Tooltip>
			) }
			renderContent={ ( { onClose } ) => (
				<DateRangePickerInner
					key={ resetKey }
					isSmall={ isSmall }
					showTwoMonths={ showTwoMonths }
					start={ start }
					end={ end }
					timezoneString={ timezoneString }
					gmtOffset={ gmtOffset }
					onChange={ onChange }
					onClose={ onClose }
					mobileLabelId={ mobileLabelId }
					desktopLabelId={ desktopLabelId }
					disableFuture={ disableFuture }
					disabledBefore={ disabledBefore }
					defaultFallbackPreset={ defaultFallbackPreset }
					hiddenPresets={ hiddenPresets }
					inputsProps={ inputsProps }
				/>
			) }
		/>
	);
}

/**
 * Inner controlled body. Remounted via `key={resetKey}` on every committed
 * change so draft state from a prior open doesn't leak.
 *
 * @param props                          - Props.
 * @param props.isSmall
 * @param props.showTwoMonths
 * @param props.start
 * @param props.end
 * @param props.timezoneString
 * @param props.gmtOffset
 * @param props.onChange
 * @param props.onClose
 * @param props.mobileLabelId
 * @param props.desktopLabelId
 * @param props.disableFuture
 * @param props.disabledBefore
 * @param props.defaultFallbackPreset
 * @param props.hiddenPresets
 * @param props.inputsProps
 * @param props.inputsProps.onStartFocus
 * @param props.inputsProps.onEndFocus
 * @param props.inputsProps.onStartBlur
 * @param props.inputsProps.onEndBlur
 * @return      Element.
 */
function DateRangePickerInner( {
	isSmall,
	showTwoMonths,
	start,
	end,
	timezoneString,
	gmtOffset,
	onChange,
	onClose,
	mobileLabelId,
	desktopLabelId,
	disableFuture,
	disabledBefore,
	defaultFallbackPreset,
	hiddenPresets,
	inputsProps,
}: {
	isSmall: boolean;
	showTwoMonths: boolean;
	start: Date;
	end: Date;
	timezoneString?: string;
	gmtOffset?: number;
	onChange: ( next: { start: Date; end: Date } ) => void;
	onClose: () => void;
	mobileLabelId: string;
	desktopLabelId: string;
	disableFuture: boolean;
	disabledBefore?: Date;
	defaultFallbackPreset: PresetId;
	hiddenPresets?: PresetId[];
	inputsProps?: {
		onStartFocus?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
		onEndFocus?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
		onStartBlur?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
		onEndBlur?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
	};
} ) {
	const [ fromDraft, setFromDraft ] = useState< Date | undefined >( () => start );
	const [ toDraft, setToDraft ] = useState< Date | undefined >( () => end );
	const [ fromStr, setFromStr ] = useState( () => formatSiteYmd( start ) );
	const [ toStr, setToStr ] = useState( () => formatSiteYmd( end ) );
	const [ compositeActiveId, setCompositeActiveId ] = useState< string | null >( null );

	const today = useMemo( () => {
		const parsed = parseYmdLocal( formatYmd( new Date(), timezoneString, gmtOffset ) );
		return (
			parsed ?? new Date( new Date().getFullYear(), new Date().getMonth(), new Date().getDate() )
		);
	}, [ timezoneString, gmtOffset ] );

	const todayStr = useMemo( () => formatSiteYmd( today ), [ today ] );

	return (
		<DateRangeContent
			isSmall={ isSmall }
			fromDraft={ fromDraft }
			toDraft={ toDraft }
			fromStr={ fromStr }
			toStr={ toStr }
			setFromDraft={ setFromDraft }
			setToDraft={ setToDraft }
			setFromStr={ setFromStr }
			setToStr={ setToStr }
			timezoneString={ timezoneString }
			gmtOffset={ gmtOffset }
			onChange={ onChange }
			onClose={ onClose }
			compositeActiveId={ compositeActiveId }
			setCompositeActiveId={ setCompositeActiveId }
			today={ today }
			todayStr={ todayStr }
			mobileLabelId={ mobileLabelId }
			desktopLabelId={ desktopLabelId }
			disableFuture={ disableFuture }
			disabledBefore={ disabledBefore }
			showTwoMonths={ showTwoMonths }
			defaultFallbackPreset={ defaultFallbackPreset }
			hiddenPresets={ hiddenPresets }
			inputsProps={ inputsProps }
		/>
	);
}
