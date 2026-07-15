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
 * WidgetRoot context and renders the post's daily views as a calendar
 * heatmap through `<WidgetState>` — week columns, weekday rows, and view
 * counts inside the cells; without a post scope (e.g. the widget added
 * outside a post detail page) the query never enables and the empty state
 * shows.
 *
 * @return The rendered widget content.
 */
function PostTrafficActivityInner() {
	const { reportParams } = useWidgetRootContext();
	const parsedPostId = Number( reportParams.post_id );
	const postId = Number.isInteger( parsedPostId ) && parsedPostId > 0 ? parsedPostId : 0;

	const { days, isLoading, isFetching, isError, hasData, refetch } = usePostTrafficActivity(
		postId,
		reportParams
	);

	const { data: heatmapData, rowLabels } = useMemo(
		() => buildCalendarHeatmapData( days ),
		[ days ]
	);

	return (
		<div className={ styles.root }>
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
						className={ styles.heatmap }
					/>
				</div>
			</WidgetState>
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
