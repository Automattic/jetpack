/**
 * External dependencies
 */
import {
	useSiteHomeUrl,
	type PostThumbnailUrls,
	type StatsTopPostsComparisonItem,
} from '@jetpack-premium-analytics/data';
import {
	MetricWithComparison,
	PostTitleLink,
	REPORT_TITLE_LINK_CLASS_NAMES,
	ReportThumbnail,
} from '@jetpack-premium-analytics/widgets-toolkit';
import { __ } from '@wordpress/i18n';
import { page as pageIcon, post as postIcon } from '@wordpress/icons';
import type { Field } from '@jetpack-premium-analytics/externals';
import type { JSX } from 'react';

const VIEWS_DATA_FORMAT = {
	type: 'number',
	options: { decimals: 0, useMultipliers: false },
} as const;

type PostTitleProps = {
	/*
	 * The post row.
	 */
	item: StatsTopPostsComparisonItem;

	/*
	 * The window and origin a link to the post's page carries.
	 */
	detailSearch: Record< string, unknown >;
};

/**
 * A post row's title. A row with an ID opens the post's page; the public URL is the fallback
 * for a row without one. The API sends no URL for the homepage row, which takes the site home
 * and never the post's page: the homepage is not a single post.
 *
 * @param {PostTitleProps} props - The props.
 * @return The linked or plain post title.
 */
function PostTitle( { item, detailSearch }: PostTitleProps ): JSX.Element {
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
 * The fields of the posts table. A getter, so the labels translate after the locale data loads.
 *
 * @param withComparison - Whether to render available period-over-period deltas.
 * @param detailSearch   - The window and origin a link to a post's page carries.
 * @param thumbnailUrls  - Thumbnail URLs keyed by post ID.
 * @return The field config.
 */
export function getPostsFields(
	withComparison: boolean,
	detailSearch: Record< string, unknown >,
	thumbnailUrls: PostThumbnailUrls = {}
): Field< StatsTopPostsComparisonItem >[] {
	return [
		{
			id: 'title',
			label: __( 'Title', 'jetpack-premium-analytics-pkg' ),
			enableGlobalSearch: true,
			enableHiding: false,
			getValue: ( { item } ) => String( item.label ?? '' ),
			render: ( { item } ) => <PostTitle item={ item } detailSearch={ detailSearch } />,
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
