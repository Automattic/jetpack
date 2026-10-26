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
	ExternalLink,
	WidgetRoot,
	WidgetState,
	safeHttpUrl,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { Stack } from '@jetpack-premium-analytics/externals';
/**
 * Internal dependencies
 */
import styles from './style.module.css';
import type { WidgetRenderProps } from '@wordpress/widget-primitives';

/**
 * Configurable attributes for the "Used on posts & pages" widget.
 *
 * The widget is scoped to a single video and has no own settings: the video is
 * chosen by the host, which composes the report params with a `post_id` (the
 * VideoPress post ID), the same single-resource scope other detail widgets use.
 * A zero-attribute widget must be typed as `Record< never, never >` so the
 * render-only type can still compose host fields like `reportParams`.
 */
export type VideoDetailEmbedsAttributes = Record< never, never >;

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
 * Presentational list for the "Used on posts & pages" widget: the pages where
 * the selected video is embedded, each as an external link. Loading / error /
 * empty are owned by the surrounding `WidgetState`.
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
							<ExternalLink className={ styles.link } href={ href } title={ page.label }>
								{ page.label }
							</ExternalLink>
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
 */
function VideoDetailEmbedsReport() {
	const { reportParams } = useWidgetRootContext();
	const videoId = toPostId( reportParams.post_id );

	const { data, isLoading, isFetching, isError, refetch } = useStatsSingleVideo( videoId );

	let body;

	if ( videoId <= 0 ) {
		body = (
			<ChartEmptyState
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
 * The report params reaching the inner component include the single-video scope
 * (`post_id`) the host composes for detail views.
 */
export default function VideoDetailEmbeds( { attributes = {} }: VideoDetailEmbedsWidgetProps ) {
	return (
		<WidgetRoot attributes={ attributes }>
			<VideoDetailEmbedsReport />
		</WidgetRoot>
	);
}
