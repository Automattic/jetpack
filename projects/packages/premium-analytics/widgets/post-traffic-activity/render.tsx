/**
 * External dependencies
 */
import { reports } from '@jetpack-premium-analytics/icons';
import {
	HeatmapChart,
	WidgetRoot,
	WidgetState,
	buildCalendarHeatmapData,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { chevronLeft, chevronRight } from '@wordpress/icons';
import { Button, Stack } from '@wordpress/ui';
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
	const parsedPostId = Number( reportParams.post_id );
	const postId = Number.isInteger( parsedPostId ) && parsedPostId > 0 ? parsedPostId : 0;

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
	} = usePostTrafficActivity( postId, reportParams );

	const { data: heatmapData, rowLabels } = useMemo(
		() => buildCalendarHeatmapData( days ),
		[ days ]
	);

	return (
		<div className={ styles.root }>
			{ /* Pager chrome stays a sibling of WidgetState so it is available in
			     every state; it only renders when the range exceeds one page. */ }
			{ isPaged && (
				<Stack align="center" justify="flex-end" gap="sm" className={ styles.pager }>
					<Button
						type="button"
						variant="minimal"
						tone="neutral"
						size="small"
						onClick={ showOlder }
						disabled={ ! canShowOlder }
						aria-label={ __( 'Older activity', 'jetpack-premium-analytics' ) }
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
						aria-label={ __( 'Newer activity', 'jetpack-premium-analytics' ) }
					>
						<Button.Icon icon={ chevronRight } size={ 16 } />
					</Button>
				</Stack>
			) }
			<div className={ styles.body }>
				<WidgetState
					isLoading={ isLoading && ! hasData }
					isFetching={ isFetching }
					isError={ isError }
					isEmpty={ postId <= 0 || heatmapData.length === 0 }
					error={ {
						description: __(
							"We couldn't load this traffic activity. Please try again in a moment.",
							'jetpack-premium-analytics'
						),
						actions: [ { label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: refetch } ],
					} }
					empty={ {
						icon: reports,
						description:
							postId <= 0
								? __(
										'Open a post or page report to see its traffic activity here.',
										'jetpack-premium-analytics'
								  )
								: __( 'No traffic activity in this period yet.', 'jetpack-premium-analytics' ),
					} }
				>
					<div className={ styles.content }>
						<HeatmapChart
							data={ heatmapData }
							rowLabels={ rowLabels }
							primaryColor="var(--wp-admin-theme-color, #3858e9)"
							withTooltips
							// Cap cells at the design's 64x42 so a short range doesn't
							// blow the few columns up to the card width, and floor the
							// width so narrow cards scroll a page instead of crushing
							// cells.
							maxCellWidth={ 64 }
							maxCellHeight={ 42 }
							minCellWidth={ 44 }
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
