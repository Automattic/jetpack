/**
 * External dependencies
 */
import { IconButton } from '@jetpack-premium-analytics/externals';
import { __, isRTL } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
import { useLayoutEffect, useRef } from 'react';
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
	canShowOlder: boolean;
	canShowNewer: boolean;
	showOlder: () => void;
	showNewer: () => void;
};

export type CalendarHeatmapPagerOverlayProps = {
	/** Omit to render the children with no arrows. */
	pager?: CalendarHeatmapPager;
	className?: string;
	children: ReactNode;
};

/**
 * Floats the pager arrows over the chart's inline edges. Per design, they show
 * only on hover/keyboard focus, and an arrow with nowhere to go is omitted
 * (not disabled) so the chart layout never shifts.
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

	// Unmounting the pressed arrow fires no blur, so focus must be handed off manually;
	// the rAF recheck catches a focus restore that lands after this commit.
	useLayoutEffect( () => {
		const doc = hostRef.current?.ownerDocument;
		if ( ! doc ) {
			return;
		}

		const handOff = () => {
			const active = doc.activeElement;
			if ( ! arrowHadFocus.current || active === olderRef.current || active === newerRef.current ) {
				return;
			}

			if ( ! canShowOlder ) {
				newerRef.current?.focus();
			} else if ( ! canShowNewer ) {
				olderRef.current?.focus();
			}
		};

		handOff();
		const frame = doc.defaultView?.requestAnimationFrame( handOff );

		return () => {
			if ( frame !== undefined ) {
				doc.defaultView?.cancelAnimationFrame( frame );
			}
		};
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
			{ /* The insets are logical, so the arrows swap sides in RTL; the glyphs
			     swap with them to keep pointing at their own edge. */ }
			{ canShowOlder && (
				<IconButton
					ref={ olderRef }
					type="button"
					variant="minimal"
					tone="neutral"
					icon={ isRTL() ? chevronRight : chevronLeft }
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
					icon={ isRTL() ? chevronLeft : chevronRight }
					label={ __( 'Newer activity', 'jetpack-premium-analytics-pkg' ) }
					onClick={ pager?.showNewer }
					className={ clsx( styles.arrow, styles.newer ) }
					{ ...trackFocus }
				/>
			) }
		</div>
	);
}
