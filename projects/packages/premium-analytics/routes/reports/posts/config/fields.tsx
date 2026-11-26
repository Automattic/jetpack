/**
 * External dependencies
 */
import {
	useSiteHomeUrl,
	type PostThumbnailUrls,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import {
	createReportOriginSearch,
	pickReportNavigationParams,
} from '@jetpack-premium-analytics/routing';
import { safeHttpUrl } from '@jetpack-premium-analytics/ui';
import {
	ExternalLink,
	MetricWithComparison,
	PostTitleLink,
	REPORT_TITLE_LINK_CLASS_NAMES,
	ReportThumbnail,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { page as pageIcon, post as postIcon } from '@wordpress/icons';
import { useSearch } from '@wordpress/route';
import { createContext, memo, useContext, useMemo, type JSX } from 'react';
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

/** Link context every post title shares, resolved once per table rather than once per row. */
export type PostTitleLinks = {
	detailSearch: Record< string, unknown >;
	homeUrl?: string;
};

type PostTitleProps = {
	item: StatsTopPostsComparisonItem;
	links: PostTitleLinks;
};

/**
 * Resolve the post titles' link context: the report's date window for the detail page, and the
 * site home for the homepage row.
 *
 * @param originSection - The active Posts & Pages report tab.
 * @return The shared title link context.
 */
export function usePostTitleLinks( originSection: ReportPostsTabId ): PostTitleLinks {
	const search = useSearch( { strict: false } ) as Record< string, unknown > | undefined;
	const homeUrl = useSiteHomeUrl();

	return useMemo(
		() => ( {
			detailSearch: {
				...pickReportNavigationParams( search ),
				...createReportOriginSearch( 'posts', originSection ),
			},
			homeUrl,
		} ),
		[ search, originSection, homeUrl ]
	);
}

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
function PostTitle( { item, links }: PostTitleProps ): JSX.Element {
	const { detailSearch, homeUrl } = links;
	const isHomepage = item.type === 'homepage';
	const title = String( item.label ?? '' );

	return (
		<PostTitleLink
			id={ isHomepage ? undefined : item.id }
			postType={ String( item.type ?? '' ) }
			label={ title }
			link={ isHomepage ? homeUrl : item.link }
			search={ detailSearch }
			classNames={ REPORT_TITLE_LINK_CLASS_NAMES }
			title={ title }
		/>
	);
}

// DataViews re-renders every mounted row, each item a fresh copy, whenever a batch mounts; the
// title link builds a router location per row, so skip it while what it shows is unchanged.
const MemoizedPostTitle = memo(
	PostTitle,
	( previous, next ) =>
		previous.links === next.links &&
		previous.item.id === next.item.id &&
		previous.item.label === next.item.label &&
		previous.item.link === next.item.link &&
		previous.item.type === next.item.type
);

// Thumbnails resolve as rows mount; read them from context so a new one does not rebuild the
// fields, which DataViews renders as component types and would remount in every row.
export const PostThumbnailUrlsContext = createContext< PostThumbnailUrls >( {} );

/**
 * Render a post row's featured-image thumbnail, or its post type icon.
 *
 * @param {object}                      props      - Component props.
 * @param {StatsTopPostsComparisonItem} props.item - The post row.
 * @return The thumbnail.
 */
function PostThumbnail( { item }: { item: StatsTopPostsComparisonItem } ): JSX.Element {
	const thumbnailUrls = useContext( PostThumbnailUrlsContext );

	return (
		<ReportThumbnail
			thumbnailUrl={ thumbnailUrls[ Number( item.id ) ] }
			fallbackIcon={ item.type === 'page' ? pageIcon : postIcon }
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
 * @param titleLinks     - Link context from `usePostTitleLinks`.
 * @return The field config.
 */
export function getPostsFields(
	withComparison: boolean,
	titleLinks: PostTitleLinks
): Field< StatsTopPostsComparisonItem >[] {
	return [
		{
			id: 'title',
			label: __( 'Title', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => String( item.label ?? '' ),
			render: ( { item } ) => <MemoizedPostTitle item={ item } links={ titleLinks } />,
		},
		{
			id: 'thumbnail',
			type: 'media',
			label: __( 'Thumbnail', 'jetpack-premium-analytics-pkg' ),
			enableHiding: false,
			render: ( { item } ) => <PostThumbnail item={ item } />,
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
				const href = safeHttpUrl( item.link );

				if ( ! href ) {
					return <>{ item.label }</>;
				}

				return <ExternalLink href={ href }>{ item.label }</ExternalLink>;
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
