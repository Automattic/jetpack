/**
 * External dependencies
 */
import { useStatsSingleVideo, type StatsSingleVideoPage } from '@jetpack-premium-analytics/data';
import {
	ChartEmptyState,
	WidgetRoot,
	WidgetState,
	useWidgetRootContext,
	type ReportParamsFieldAttributes,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { video } from '@wordpress/icons';
import { Link, Stack } from '@wordpress/ui';
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

/**
 * Resolves the VideoPress post ID from the host-composed report params. The
 * `post_id` report param is typed `string | number`, so it is defensively
 * coerced to a positive integer; anything else yields `NaN`, which signals
 * "no video selected".
 *
 * @param postId - The `post_id` report param.
 * @return The video's post ID, or `NaN` when none is set.
 */
function toVideoId( postId: string | number | undefined ): number {
	const parsed = typeof postId === 'number' ? postId : Number.parseInt( postId ?? '', 10 );

	return Number.isInteger( parsed ) && parsed > 0 ? parsed : NaN;
}

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
			{ pages.map( ( page, index ) => (
				<li key={ `${ index }-${ page.link }` } className={ styles.item }>
					<Link
						className={ styles.link }
						href={ page.link }
						variant="unstyled"
						openInNewTab
						title={ page.label }
					>
						{ page.label }
					</Link>
				</li>
			) ) }
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
	const videoId = toVideoId( reportParams.post_id );

	const { data, isLoading, isFetching, isError, refetch } = useStatsSingleVideo(
		videoId,
		reportParams
	);

	let body;

	if ( ! Number.isInteger( videoId ) ) {
		body = (
			<ChartEmptyState
				icon={ video }
				text={ __(
					'Select a video to see where it is embedded across your site.',
					'jetpack-premium-analytics'
				) }
			/>
		);
	} else {
		const pages = data?.pages ?? [];

		body = (
			<WidgetState
				isLoading={ isLoading }
				isFetching={ isFetching }
				isError={ isError }
				isEmpty={ pages.length === 0 }
				error={ {
					description: __(
						"We couldn't load video embeds. Please try again in a moment.",
						'jetpack-premium-analytics'
					),
					actions: [
						{ label: __( 'Retry', 'jetpack-premium-analytics' ), onClick: () => void refetch() },
					],
				} }
				empty={ {
					icon: video,
					description: __(
						'This video has not been embedded on any pages yet.',
						'jetpack-premium-analytics'
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
