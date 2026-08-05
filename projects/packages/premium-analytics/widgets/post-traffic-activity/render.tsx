/**
 * External dependencies
 */
import { toPostId } from '@jetpack-premium-analytics/data';
import { reports } from '@jetpack-premium-analytics/icons';
import {
	HeatmapChartUnresponsive,
	WidgetRoot,
	WidgetState,
	buildCalendarHeatmapData,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useResizeObserver } from '@wordpress/compose';
import { useMemo, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Button, Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import usePostTrafficActivity from './use-post-traffic-activity';
import type { PostTrafficActivityAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

type PostTrafficActivityRenderAttributes = PostTrafficActivityAttributes &
	Partial< ReportParamsFieldAttributes >;
type PostTrafficActivityWidgetProps = WidgetRenderProps< PostTrafficActivityRenderAttributes >;

/**
 * Sizing the page to the card: one page shows as many whole week columns as
 * fit at the design's cell width. The constants mirror the chart's
 * non-compact metrics — 64px design cells, the 4px cell gap, and an
 * allowance for the weekday-label gutter.
 */
const CELL_WIDTH = 64;
const CELL_GAP = 4;
const LABEL_GUTTER = 48;
const MIN_PAGE_WEEKS = 4;
const DEFAULT_PAGE_WEEKS = 16;

/**
 * Whole week columns that fit the measured card width.
 *
 * @param width - The measured content width, if known yet.
 * @return The page width in week columns.
 */
function weeksForWidth( width?: number ): number {
	if ( ! width ) {
		return DEFAULT_PAGE_WEEKS;
	}

	return Math.max(
		MIN_PAGE_WEEKS,
		Math.floor( ( width - LABEL_GUTTER ) / ( CELL_WIDTH + CELL_GAP ) )
	);
}

/**
 * Traffic activity inner component. Reads the post scope and date range from
 * WidgetRoot context and renders one page of the post's daily views as a
 * calendar heatmap through `<WidgetState>` — week columns, weekday rows, and
 * view counts inside the cells. Ranges longer than one page grow a header
 * pager stepping through the range; without a post scope (e.g. the widget
 * added outside a post detail page) the query never enables and the empty
 * state shows.
 *
 * @return The rendered widget content.
 */
function PostTrafficActivityInner() {
	const { reportParams } = useWidgetRootContext();
	const postId = toPostId( reportParams.post_id );

	// One page spans the whole week columns that fit the measured card width,
	// so the grid fills the card without horizontal scrolling.
	const [ width, setWidth ] = useState< number >();
	const measureRef = useResizeObserver< HTMLDivElement >( entries => {
		const rect = entries[ 0 ]?.contentRect;
		if ( rect ) {
			// Round and dedupe so subpixel resize reports don't churn renders.
			const next = Math.round( rect.width );
			setWidth( previous => ( previous === next ? previous : next ) );
		}
	} );

	const {
		days,
		isPaged,
		canShowOlder,
		canShowNewer,
		showOlder,
		showNewer,
		isLoading,
		isFetching,
		isError,
		hasData,
		refetch,
	} = usePostTrafficActivity( postId, reportParams, weeksForWidth( width ) * 7 );

	const { data: heatmapData, rowLabels } = useMemo(
		() => buildCalendarHeatmapData( days ),
		[ days ]
	);

	return (
		<div ref={ measureRef } className={ styles.root }>
			<div className={ styles.body }>
				<WidgetState
					isLoading={ isLoading && ! hasData }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ postId <= 0 || heatmapData.length === 0 }
					error={ {
						description: __(
							"We couldn't load this traffic activity. Please try again in a moment.",
							'jetpack-premium-analytics-pkg'
						),
						actions: [
							{ label: __( 'Retry', 'jetpack-premium-analytics-pkg' ), onClick: refetch },
						],
					} }
					// A post with no traffic renders the all-blank grid (the sparse
					// treatment), so the empty state only covers the missing scope.
					empty={ {
						icon: reports,
						description: __(
							'Open a post or page report to see its traffic activity here.',
							'jetpack-premium-analytics-pkg'
						),
					} }
				>
					<div className={ styles.content }>
						{ /* The pager centers with the grid as one block; it only exists
						     when the range exceeds one page (and only in the ready state,
						     where the grid it steps is visible). */ }
						{ isPaged && (
							<Stack align="center" justify="flex-end" gap="sm" className={ styles.pager }>
								<Button
									type="button"
									variant="minimal"
									tone="neutral"
									size="small"
									onClick={ showOlder }
									disabled={ ! canShowOlder }
									aria-label={ __( 'Older activity', 'jetpack-premium-analytics-pkg' ) }
								>
									<Button.Icon icon={ chevronLeft } size={ 16 } />
								</Button>
								<Button
									type="button"
									variant="minimal"
									tone="neutral"
									size="small"
									onClick={ showNewer }
									disabled={ ! canShowNewer }
									aria-label={ __( 'Newer activity', 'jetpack-premium-analytics-pkg' ) }
								>
									<Button.Icon icon={ chevronRight } size={ 16 } />
								</Button>
							</Stack>
						) }
						{ /* The unresponsive chart export: the capped grid is
						     content-sized and the page span is derived from the widget's
						     own measurement, so the responsive wrapper's full-height
						     measuring container would only break the centered block. */ }
						<HeatmapChartUnresponsive
							data={ heatmapData }
							rowLabels={ rowLabels }
							primaryColor="var(--wp-admin-theme-color, #3858e9)"
							withTooltips
							// Cap cells at the design's 64x42; the page span is already
							// sized to the card, so tracks never need to shrink below it.
							maxCellWidth={ 64 }
							maxCellHeight={ 42 }
							className={ styles.heatmap }
						/>
					</div>
				</WidgetState>
			</div>
		</div>
	);
}

/**
 * Traffic activity widget: the scoped post's daily views as a calendar
 * heatmap — the post detail Traffic view's activity card, replacing the
 * legacy months table.
 *
 * @param {PostTrafficActivityWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function PostTrafficActivity( { attributes = {} }: PostTrafficActivityWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<PostTrafficActivityInner />
		</WidgetRoot>
	);
}
