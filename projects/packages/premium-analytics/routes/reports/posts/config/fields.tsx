/**
 * External dependencies
 */
import {
	useSiteHomeUrl,
	type PostThumbnailUrls,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import { Link as UiLink } from '@jetpack-premium-analytics/externals';
import {
	createReportOriginSearch,
	pickReportNavigationParams,
} from '@jetpack-premium-analytics/routing';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import {
	MetricWithComparison,
	PostTitleLink,
	REPORT_TITLE_LINK_CLASS_NAMES,
	ReportThumbnail,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { page as pageIcon, post as postIcon } from '@wordpress/icons';
import { useSearch } from '@wordpress/route';
import { useMemo, type JSX } from 'react';
/**
 * Internal dependencies
 */
import type { ReportPostsTabId } from './tabs';
import type { Field } from '@jetpack-premium-analytics/externals';
import type { ArchiveRow } from '@jetpack-premium-analytics/widgets-toolkit';

const VIEWS_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

type PostTitleProps = {
	item: StatsTopPostsComparisonItem;
	originSection: ReportPostsTabId;
};

/**
 * Render a post row's title. Rows with an ID drill into the internal post/page
 * detail page, carrying the report's current date window for its breadcrumbs
 * to return to; the public URL is the external fallback for rows without one.
 *
 * The API sends no URL for homepage rows, so they fall back to the site home
 * resolved from core settings. They never take the detail page: the homepage
 * is not a single post.
 *
 * @param {PostTitleProps} props - Component props.
 * @return The linked or plain post title.
 */
function PostTitle( { item, originSection }: PostTitleProps ): JSX.Element {
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const detailSearch = useMemo(
		() => ( {
			...pickReportNavigationParams( search ),
			...createReportOriginSearch( 'posts', originSection ),
		} ),
		[ search, originSection ]
	);
	const homeUrl = useSiteHomeUrl();

	const isHomepage = item.type === 'homepage';
	const title = String( item.label ?? '' );

	return (
		<PostTitleLink
			id={ isHomepage ? undefined : item.id }
			label={ title }
			link={ isHomepage ? homeUrl : item.link }
			search={ detailSearch }
			classNames={ REPORT_TITLE_LINK_CLASS_NAMES }
			title={ title }
		/>
	);
}

/**
 * DataViews field config for the Posts & Pages records table.
 *
 * Built as a getter (not a module constant) so the labels translate after the
 * i18n locale data has loaded, mirroring the tab/section definitions on the
 * other routes.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @param originSection  - The active Posts & Pages report tab.
 * @param thumbnailUrls  - Thumbnail URLs keyed by post ID.
 * @return The field config.
 */
export function getPostsFields(
	withComparison: boolean,
	originSection: ReportPostsTabId,
	thumbnailUrls: PostThumbnailUrls = {}
): Field< StatsTopPostsComparisonItem >[] {
	return [
		{
			id: 'title',
			label: __( 'Title', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => String( item.label ?? '' ),
			render: ( { item } ) => <PostTitle item={ item } originSection={ originSection } />,
		},
		{
			id: 'thumbnail',
			type: 'media',
			label: __( 'Thumbnail', 'jetpack-premium-analytics-pkg' ),
			enableHiding: false,
			render: ( { item } ) => (
				<ReportThumbnail
					thumbnailUrl={ thumbnailUrls[ Number( item.id ) ] }
					fallbackIcon={ item.type === 'page' ? pageIcon : postIcon }
				/>
			),
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.views }
					previousValue={ withComparison ? item.previousViews : undefined }
					dataFormat={ VIEWS_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
	];
}

/**
 * DataViews field config for the Archives records table.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @return The field config.
 */
export function getArchivesFields( withComparison = false ): Field< ArchiveRow >[] {
	return [
		{
			id: 'title',
			label: __( 'Title', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => item.label,
			render: ( { item } ) => {
				const label = item.isGroup ? <strong>{ item.label }</strong> : <>{ item.label }</>;
				const href = safeHttpUrl( item.link );

				if ( ! href ) {
					return label;
				}

				return (
					<UiLink href={ href } variant="unstyled" openInNewTab rel="noopener noreferrer">
						{ label }
					</UiLink>
				);
			},
		},
		{
			id: 'views',
			label: __( 'Views', 'jetpack-premium-analytics-pkg' ),
			getValue: ( { item } ) => item.views,
			render: ( { item } ) => (
				<MetricWithComparison
					value={ item.views }
					previousValue={ withComparison ? item.previousViews : undefined }
					dataFormat={ VIEWS_DATA_FORMAT }
					fontSize="md"
				/>
			),
		},
	];
}
