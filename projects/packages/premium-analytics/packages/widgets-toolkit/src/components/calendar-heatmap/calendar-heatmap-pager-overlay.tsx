/**
 * External dependencies
 */
import { Button } from '@jetpack-premium-analytics/externals';
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import clsx from 'clsx';
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
 * hover keep them visible. The host wraps the chart so the arrows center on it
 * vertically, and it always renders — pager or not — so paging in and out of a
 * range never changes the chart's layout.
 *
 * @return The chart wrapped in the pager host.
 */
export function CalendarHeatmapPagerOverlay( {
	pager,
	className,
	children,
}: CalendarHeatmapPagerOverlayProps ) {
	return (
		<div className={ clsx( styles.host, className ) }>
			{ children }
			{ pager && (
				<>
					<Button
						type="button"
						variant="minimal"
						tone="neutral"
						onClick={ pager.showOlder }
						disabled={ ! pager.canShowOlder }
						aria-label={ __( 'Older activity', 'jetpack-premium-analytics-pkg' ) }
						className={ clsx( styles.arrow, styles.older ) }
					>
						<Button.Icon icon={ chevronLeft } size={ 24 } />
					</Button>
					<Button
						type="button"
						variant="minimal"
						tone="neutral"
						onClick={ pager.showNewer }
						disabled={ ! pager.canShowNewer }
						aria-label={ __( 'Newer activity', 'jetpack-premium-analytics-pkg' ) }
						className={ clsx( styles.arrow, styles.newer ) }
					>
						<Button.Icon icon={ chevronRight } size={ 24 } />
					</Button>
				</>
			) }
		</div>
	);
}
