/**
 * External dependencies
 */
import { IconButton } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
import { useEffect, useRef } from 'react';
/**
 * Internal dependencies
 */
import styles from './calendar-heatmap-pager-overlay.module.scss';
import type { ReactNode } from 'react';

/**
 * Paging state for a calendar heatmap whose range holds more week columns than
 * its tile can draw. The newest page shows first; "older" steps back in time.
 */
export type CalendarHeatmapPager = {
	/** Whether an older page exists inside the range. */
	canShowOlder: boolean;
	/** Whether a newer page exists (the newest page shows first). */
	canShowNewer: boolean;
	showOlder: () => void;
	showNewer: () => void;
};

export type CalendarHeatmapPagerOverlayProps = {
	/** The paging state; omit it to render the children with no arrows. */
	pager?: CalendarHeatmapPager;
	/** Optional class for widget-specific layout on the host element. */
	className?: string;
	children: ReactNode;
};

/**
 * Floats the calendar-heatmap pager arrows over the chart's inline edges.
 *
 * Per the design, the arrows appear on hover (or keyboard focus) instead of
 * taking a header row the widget chrome has no room for; viewports without
 * hover keep them visible. An arrow with nowhere to go is not rendered at all
 * rather than shown disabled, also per the design. The host wraps the chart so
 * the arrows center on it vertically, and it always renders — pager or not —
 * so paging in and out of a range never changes the chart's layout.
 *
 * @return The chart wrapped in the pager host.
 */
export function CalendarHeatmapPagerOverlay( {
	pager,
	className,
	children,
}: CalendarHeatmapPagerOverlayProps ) {
	const hostRef = useRef< HTMLDivElement | null >( null );
	const olderRef = useRef< HTMLButtonElement | null >( null );
	const newerRef = useRef< HTMLButtonElement | null >( null );
	// Whether an arrow holds focus. An unmounting node fires no blur, so this
	// deliberately stays `true` across the removal the effect below handles.
	const arrowHadFocus = useRef( false );

	const canShowOlder = pager?.canShowOlder ?? false;
	const canShowNewer = pager?.canShowNewer ?? false;

	// Keyboard paging can remove the very arrow being pressed — reaching an
	// end unmounts it, dropping focus to `<body>`: `:focus-within` collapses
	// and the surviving arrow fades out mid-interaction. Hand focus to that
	// surviving arrow instead. Pointer users never enter here: their arrow
	// removal happens under `:hover`, which keeps the overlay visible, and
	// they leave `arrowHadFocus` behind only alongside a body-focus drop.
	useEffect( () => {
		const doc = hostRef.current?.ownerDocument;
		if ( ! doc || ! arrowHadFocus.current || doc.activeElement !== doc.body ) {
			return;
		}

		if ( ! canShowOlder ) {
			newerRef.current?.focus();
		} else if ( ! canShowNewer ) {
			olderRef.current?.focus();
		}
	}, [ canShowOlder, canShowNewer ] );

	const trackFocus = {
		onFocus: () => {
			arrowHadFocus.current = true;
		},
		onBlur: () => {
			arrowHadFocus.current = false;
		},
	};

	return (
		<div ref={ hostRef } className={ clsx( styles.host, className ) }>
			{ children }
			{ canShowOlder && (
				<IconButton
					ref={ olderRef }
					type="button"
					variant="minimal"
					tone="neutral"
					icon={ chevronLeft }
					label={ __( 'Older activity', 'jetpack-premium-analytics-pkg' ) }
					onClick={ pager?.showOlder }
					className={ clsx( styles.arrow, styles.older ) }
					{ ...trackFocus }
				/>
			) }
			{ canShowNewer && (
				<IconButton
					ref={ newerRef }
					type="button"
					variant="minimal"
					tone="neutral"
					icon={ chevronRight }
					label={ __( 'Newer activity', 'jetpack-premium-analytics-pkg' ) }
					onClick={ pager?.showNewer }
					className={ clsx( styles.arrow, styles.newer ) }
					{ ...trackFocus }
				/>
			) }
		</div>
	);
}
