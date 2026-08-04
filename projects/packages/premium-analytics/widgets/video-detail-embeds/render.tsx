/**
 * External dependencies
 */
import {
	useStatsSingleVideo,
	toPostId,
	type StatsSingleVideoPage,
} from '@jetpack-premium-analytics/data';
import {
	ChartEmptyState,
	WidgetRoot,
	WidgetState,
	safeHttpUrl,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
import { Link, Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import { type VideoDetailEmbedsAttributes } from './widget';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

// The widget has no own settings; the host injects the date range and the
// single-video scope (`post_id`) through `reportParams`.
type VideoDetailEmbedsRenderAttributes = VideoDetailEmbedsAttributes &
	Partial< ReportParamsFieldAttributes >;
type VideoDetailEmbedsWidgetProps = WidgetRenderProps< VideoDetailEmbedsRenderAttributes >;

type VideoEmbedsListProps = {
	/**
	 * Pages where the video is embedded, each rendered as an external link.
	 */
	pages: StatsSingleVideoPage[];
};

/**
 * Presentational list for the "Video embeds" widget: the pages where the
 * selected video is embedded, each as an external link. Loading / error /
 * empty are owned by the surrounding `WidgetState`.
 *
 * @param {VideoEmbedsListProps} props - The component props.
 * @return The rendered list.
 */
function VideoEmbedsList( { pages }: VideoEmbedsListProps ) {
	return (
		<ul className={ styles.list }>
			{ pages.map( ( page, index ) => {
				// The report returns each embed location as a bare string used verbatim
				// as the href, so a page that is not a safe http(s) URL still lists as
				// plain text rather than becoming a clickable link.
				const href = safeHttpUrl( page.link );

				return (
					<li key={ `${ index }-${ page.link }` } className={ styles.item }>
						{ href ? (
							<Link
								className={ styles.link }
								href={ href }
								variant="unstyled"
								openInNewTab
								title={ page.label }
							>
								{ page.label }
							</Link>
						) : (
							<span className={ styles.link } title={ page.label }>
								{ page.label }
							</span>
						) }
					</li>
				);
			} ) }
		</ul>
	);
}

/**
 * Fetches the single-video report through `useStatsSingleVideo` and renders the
 * embed pages through `WidgetState`. The video is scoped by the host through
 * `reportParams.post_id`; the query stays disabled until a video is selected,
 * with a prompt shown instead of the data states.
 *
 * @return The widget content.
 */
function VideoDetailEmbedsReport() {
	const { reportParams } = useWidgetRootContext();
	const videoId = toPostId( reportParams.post_id );

	const { data, isLoading, isFetching, isError, refetch } = useStatsSingleVideo( videoId );

	let body;

	if ( videoId <= 0 ) {
		body = (
			<ChartEmptyState
				icon={ video }
				text={ __(
					'Select a video to see where it is embedded across your site.',
					'jetpack-premium-analytics-pkg'
				) }
			/>
		);
	} else {
		const pages = data?.pages ?? [];

		body = (
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				// The query keeps prior data via `placeholderData`, so a transient
				// refetch failure keeps the pages visible; only surface the error
				// when there is nothing to show.
				isError={ pages.length === 0 && isError }
				isEmpty={ pages.length === 0 }
				error={ {
					description: __(
						"We couldn't load video embeds. Please try again in a moment.",
						'jetpack-premium-analytics-pkg'
					),
					actions: [
						{
							label: __( 'Retry', 'jetpack-premium-analytics-pkg' ),
							onClick: () => void refetch(),
						},
					],
				} }
				empty={ {
					icon: video,
					description: __(
						'This video has not been embedded on any pages yet.',
						'jetpack-premium-analytics-pkg'
					),
				} }
			>
				<VideoEmbedsList pages={ pages } />
			</WidgetState>
		);
	}

	return (
		<Stack className={ styles.root }>
			<div className={ styles.content }>{ body }</div>
		</Stack>
	);
}

/**
 * Video embeds widget render entry point.
 *
 * WidgetRoot provides the analytics query client, chart theme, and the report
 * params consumed by the inner component — including the single-video scope
 * (`post_id`) the host composes for detail views.
 *
 * @param {VideoDetailEmbedsWidgetProps} props - The widget render props.
 * @return The rendered widget.
 */
export default function VideoDetailEmbeds( { attributes = {} }: VideoDetailEmbedsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<VideoDetailEmbedsReport />
		</WidgetRoot>
	);
}
