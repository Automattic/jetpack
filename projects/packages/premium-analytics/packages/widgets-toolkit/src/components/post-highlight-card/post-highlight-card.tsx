/**
 * External dependencies
 */
import { Text, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { __, sprintf } from '@wordpress/i18n';
import { format, parseISO } from 'date-fns';
/**
 * Internal dependencies
 */
import { MetricValue } from '../metric-value';
import { PostTitleLink } from '../post-title-link';
import styles from './post-highlight-card.module.scss';
import type { DataFormat } from '../../types';

/**
 * Shortened counts with no decimals, matching the Stats widget convention.
 */
const DEFAULT_METRIC_FORMAT: DataFormat = {
	type: 'number',
	options: { useMultipliers: true, decimals: 0 },
};

export type PostHighlightCardMetric = {
	/**
	 * Stable identifier for the metric.
	 */
	key: string;

	/**
	 * The metric label (e.g. "Views").
	 */
	label: string;

	/**
	 * The metric value, or `undefined` when unavailable — rendered as a dash, so a
	 * failed request is not shown as a real count of zero.
	 */
	value: number | undefined;

	/**
	 * Caveat about how the value is aggregated, e.g. that it is an all-time total
	 * while its neighbours are scoped to the dashboard's date range. Shown as a
	 * hover tooltip on the tile and mirrored as visually hidden text for
	 * assistive technology.
	 */
	note?: string;
};

export type PostHighlightCardProps = {
	/**
	 * The post title. Rendered as plain text when `url` is absent or unsafe.
	 */
	title: string;

	/**
	 * Public URL of the post. Used as the link when there is no post ID.
	 */
	url?: string | null;

	/**
	 * Post ID. When present the title links to the internal detail route.
	 */
	postId?: number | string;

	/**
	 * Search params for the detail route, from `pickReportDateParams()`.
	 */
	detailSearch?: Record< string, unknown >;

	/**
	 * The post's publish timestamp, as an ISO date string.
	 */
	date?: string;

	/**
	 * Featured image URL. Omit for a card with no media.
	 */
	imageUrl?: string;

	/**
	 * Alternative text for the featured image.
	 */
	imageAlt?: string;

	/**
	 * The metric tiles, primary metric first: on narrow cells the tiles wrap, so
	 * the first one stays visible alongside the title and publish line.
	 */
	metrics: PostHighlightCardMetric[];

	/**
	 * Format configuration for the metric values.
	 * @default shortened counts with no decimals
	 */
	dataFormat?: DataFormat;
};

/**
 * Formats an ISO date string as a "Post published on <date>" line, falling back
 * to the raw string when the date cannot be parsed.
 *
 * @param date - The post's ISO date string.
 * @return The formatted publish line, or an empty string when absent.
 */
function formatPublishDate( date: string ): string {
	if ( ! date ) {
		return '';
	}

	const parsed = parseISO( date );
	const formatted = Number.isNaN( parsed.getTime() ) ? date : format( parsed, 'PP' );

	return sprintf(
		/* translators: %s: the post's publish date, e.g. "Jun 5, 2026". */
		__( 'Post published on %s', 'jetpack-premium-analytics-pkg' ),
		formatted
	);
}

/**
 * A single labelled metric value, with an optional aggregation caveat.
 *
 * @param props            - The component props.
 * @param props.metric     - The metric to render.
 * @param props.dataFormat - Format configuration for the value.
 * @return The rendered metric tile.
 */
function PostHighlightMetric( {
	metric,
	dataFormat,
}: {
	metric: PostHighlightCardMetric;
	dataFormat: DataFormat;
} ) {
	return (
		<div className={ styles.metric } title={ metric.note }>
			<Text className={ styles.metricLabel } variant="body-md">
				{ metric.label }
			</Text>
			{ /* The `title` tooltip is invisible to keyboard and screen-reader users,
			     so the caveat is repeated as visually hidden text. */ }
			{ metric.note && <VisuallyHidden>{ metric.note }</VisuallyHidden> }
			{ metric.value === undefined ? (
				<Text className={ styles.metricValue } variant="body-md">
					{ /* Spelled out below, since a screen reader may skip the dash. */ }
					<span aria-hidden="true">&mdash;</span>
					<VisuallyHidden>
						{ __( 'Not available', 'jetpack-premium-analytics-pkg' ) }
					</VisuallyHidden>
				</Text>
			) : (
				<MetricValue
					className={ styles.metricValue }
					value={ metric.value }
					dataFormat={ dataFormat }
				/>
			) }
		</div>
	);
}

/**
 * Presentational card highlighting a single post: its title (linking to the
 * published post), its publish date, a row of metric tiles, and its featured
 * image when present.
 *
 * Shared by the "Latest post" and "Popular post" widgets. It renders only the
 * populated state — loading, error, and empty belong to the calling widget's
 * `<WidgetState>` — and adapts to the dashboard cell size through the container
 * queries in its stylesheet.
 *
 * @param {PostHighlightCardProps} props - The component props.
 * @return The rendered card.
 */
export function PostHighlightCard( {
	title,
	url,
	postId,
	detailSearch,
	date = '',
	imageUrl = '',
	imageAlt = '',
	metrics,
	dataFormat = DEFAULT_METRIC_FORMAT,
}: PostHighlightCardProps ) {
	const publishDate = formatPublishDate( date );

	return (
		<div className={ styles.root }>
			<div className={ styles.content }>
				<div className={ styles.header }>
					<Text className={ styles.title } variant="heading-2xl" render={ <h3 /> }>
						<PostTitleLink
							id={ postId }
							label={ title }
							link={ url }
							search={ detailSearch }
							title={ title }
							classNames={ { internal: styles.titleLink, external: styles.titleLink } }
						/>
					</Text>
					{ publishDate && (
						<Text className={ styles.date } variant="body-md">
							{ publishDate }
						</Text>
					) }
				</div>
				<div className={ styles.metrics }>
					{ metrics.map( metric => (
						<PostHighlightMetric key={ metric.key } metric={ metric } dataFormat={ dataFormat } />
					) ) }
				</div>
			</div>
			{ imageUrl && (
				<div className={ styles.media }>
					<img className={ styles.image } src={ imageUrl } alt={ imageAlt } />
				</div>
			) }
		</div>
	);
}
