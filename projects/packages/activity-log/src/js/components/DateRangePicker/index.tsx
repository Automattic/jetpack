/**
 * Date-range picker shown above the Activity Log table on paid tiers.
 * Port of Calypso's
 * `client/dashboard/components/date-range-picker/index.tsx`.
 *
 * The picker is two pieces: a Dropdown toggle showing the current
 * label, and the `DateRangeContent` popover with the preset sidebar,
 * date inputs, and calendar. State inside the popover is intentionally
 * remounted whenever the committed range changes (via the `resetKey`)
 * so draft edits don't linger across opens.
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
// stylesheet — the JS bundle doesn't carry it. Import it here so the
// calendar renders with the Calypso-style clean day numbers instead
// of wp-admin's default button boxes.
import '@automattic/ui/style.css';

type DateRangePickerProps = {
	start: Date;
	end: Date;
	onChange: ( next: { start: Date; end: Date } ) => void;
	timezoneString?: string;
	gmtOffset?: number;
	locale: string;
	disableFuture?: boolean;
	defaultFallbackPreset?: PresetId;
	inputsProps?: {
		onStartFocus?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
		onEndFocus?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
		onStartBlur?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
		onEndBlur?: ( e: React.FocusEvent< HTMLInputElement > ) => void;
	};
	// When `disabled`, the toggle renders as a non-interactive button
	// wrapped in `disabledTooltipText` (no Dropdown / popover). Lets the
	// free-tier surface keep the picker visible as an upgrade cue
	// without rebuilding the trigger markup elsewhere.
	disabled?: boolean;
	disabledTooltipText?: string;
};

/**
 *
 * @param root0
 * @param root0.start
 * @param root0.end
 * @param root0.onChange
 * @param root0.gmtOffset
 * @param root0.timezoneString
 * @param root0.locale
 * @param root0.disableFuture
 * @param root0.defaultFallbackPreset
 * @param root0.inputsProps
 * @param root0.disabled
 * @param root0.disabledTooltipText
 */
export function DateRangePicker( {
	start,
	end,
	onChange,
	gmtOffset,
	timezoneString,
	locale,
	disableFuture = true,
	defaultFallbackPreset = 'last-7-days',
	inputsProps,
	disabled = false,
	disabledTooltipText,
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

	if ( disabled ) {
		return (
			<Tooltip
				text={ disabledTooltipText ?? __( 'Select a date range', 'jetpack-activity-log' ) }
				placement="top"
			>
				<div className="daterange-input__toggle">
					<Button
						type="button"
						variant="tertiary"
						disabled
						accessibleWhenDisabled
						aria-label={ sprintf(
							/* translators: %s: date range label */
							__( 'Date range: %s.', 'jetpack-activity-log' ),
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
		);
	}

	return (
		<Dropdown
			popoverProps={ { className: 'daterange-popover' } }
			renderToggle={ ( { onToggle, isOpen } ) => (
				<Tooltip text={ __( 'Select a date range', 'jetpack-activity-log' ) } placement="top">
					<div className="daterange-input__toggle">
						<Button
							type="button"
							variant="tertiary"
							onClick={ onToggle }
							aria-haspopup="dialog"
							aria-expanded={ isOpen }
							aria-label={ sprintf(
								/* translators: %s: date range label */
								__( 'Date range: %s. Activate to open calendar.', 'jetpack-activity-log' ),
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
					defaultFallbackPreset={ defaultFallbackPreset }
					inputsProps={ inputsProps }
				/>
			) }
		/>
	);
}

/**
 *
 * @param root0
 * @param root0.isSmall
 * @param root0.showTwoMonths
 * @param root0.start
 * @param root0.end
 * @param root0.timezoneString
 * @param root0.gmtOffset
 * @param root0.onChange
 * @param root0.onClose
 * @param root0.mobileLabelId
 * @param root0.desktopLabelId
 * @param root0.disableFuture
 * @param root0.defaultFallbackPreset
 * @param root0.inputsProps
 * @param root0.inputsProps.onStartFocus
 * @param root0.inputsProps.onEndFocus
 * @param root0.inputsProps.onStartBlur
 * @param root0.inputsProps.onEndBlur
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
	defaultFallbackPreset,
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
	defaultFallbackPreset: PresetId;
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
			showTwoMonths={ showTwoMonths }
			defaultFallbackPreset={ defaultFallbackPreset }
			inputsProps={ inputsProps }
		/>
	);
}
