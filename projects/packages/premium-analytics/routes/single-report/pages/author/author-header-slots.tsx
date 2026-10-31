/**
 * External dependencies
 */
import { parseSiteDateTime } from '@jetpack-premium-analytics/datetime';
import { Icon, Skeleton, VisuallyHidden } from '@jetpack-premium-analytics/externals';
import { formatDate, formatMetricValue } from '@jetpack-premium-analytics/formatters';
import { useCallback, useState } from '@wordpress/element';
import { __, _n, sprintf } from '@wordpress/i18n';
import { postAuthor } from '@wordpress/icons';
/**
 * Internal dependencies
 */
import { DETAIL_HEADER_GLYPH_SIZE } from '../../detail-header';
import placeholders from '../../detail-header.module.scss';
import styles from './author-header-slots.module.scss';
import { authorDisplayName, type AuthorSummary } from './use-author-summary';
import type { SingleReportHeaderSlots } from '../adapter';

/**
 * The author's avatar. Gravatar URLs can 404 for a deleted account, so a
 * failed load swaps in the placeholder glyph.
 *
 * @param props           - Component props.
 * @param props.avatarUrl - The avatar URL, when the author carries one.
 * @return The avatar image or its placeholder glyph.
 */
function AuthorAvatar( { avatarUrl }: { avatarUrl?: string } ) {
	const [ failedAvatarUrl, setFailedAvatarUrl ] = useState< string >();
	const hideAvatar = useCallback( () => setFailedAvatarUrl( avatarUrl ), [ avatarUrl ] );

	return avatarUrl && avatarUrl !== failedAvatarUrl ? (
		<img className={ styles.avatar } src={ avatarUrl } alt="" onError={ hideAvatar } />
	) : (
		<Icon icon={ postAuthor } size={ DETAIL_HEADER_GLYPH_SIZE } />
	);
}

/**
 * "N posts · writing since <Month YYYY>", in the site timezone so the month
 * matches the post list. Either half stands alone when the other is unknown.
 *
 * @param postCount          - Published posts by the author.
 * @param firstPublishedDate - When the author first published content.
 * @return The subtitle, or undefined when neither half is known.
 */
export function authorSubtitle(
	postCount: number | undefined,
	firstPublishedDate: string | undefined
): string | undefined {
	const parts: string[] = [];

	if ( postCount !== undefined ) {
		parts.push(
			sprintf(
				/* translators: %s: number of published posts. */
				_n( '%s post', '%s posts', postCount, 'jetpack-premium-analytics-pkg' ),
				formatMetricValue( postCount, 'number', { decimals: 0 } )
			)
		);
	}

	const since = parseSiteDateTime( firstPublishedDate );
	if ( since ) {
		parts.push(
			sprintf(
				/* translators: %s: month and year of the author's first post, e.g. "July 2023". */
				__( 'writing since %s', 'jetpack-premium-analytics-pkg' ),
				formatDate( since, 'monthYear' )
			)
		);
	}

	return parts.length ? parts.join( ' · ' ) : undefined;
}

/**
 * The author identity for the page header. Every summary state names the page,
 * so the header keeps its `h1` and its box while the author loads or fails.
 *
 * @param summary - The author summary, in any state.
 * @return The header slots for this author.
 */
export function authorHeaderSlots( summary: AuthorSummary ): SingleReportHeaderSlots {
	const glyph = <Icon icon={ postAuthor } size={ DETAIL_HEADER_GLYPH_SIZE } />;

	if ( summary.isLoading ) {
		return {
			visual: glyph,
			busy: true,
			title: (
				<>
					<VisuallyHidden>{ __( 'Loading…', 'jetpack-premium-analytics-pkg' ) }</VisuallyHidden>
					<Skeleton className={ placeholders.titlePlaceholder } />
				</>
			),
			subTitle: <Skeleton className={ placeholders.subTitlePlaceholder } />,
		};
	}

	// A failed or missing author has no trustworthy name; the notice below the
	// header carries the reason and the way out.
	if ( summary.isError || summary.isNotFound ) {
		return {
			visual: glyph,
			title: summary.isNotFound
				? __( 'Author not found', 'jetpack-premium-analytics-pkg' )
				: __( 'Author unavailable', 'jetpack-premium-analytics-pkg' ),
		};
	}

	// The post count resolves on its own; the writing-since month stands without it.
	const postCount = summary.isPostsLoading || summary.isPostsError ? undefined : summary.postCount;
	let subTitle: SingleReportHeaderSlots[ 'subTitle' ] = authorSubtitle(
		postCount,
		summary.firstPublishedDate
	);
	if ( ! subTitle && summary.isPostsLoading ) {
		subTitle = <Skeleton className={ placeholders.subTitlePlaceholder } />;
	} else if ( ! subTitle && summary.isPostsError ) {
		subTitle = __( "We couldn't load this author's posts.", 'jetpack-premium-analytics-pkg' );
	}

	return {
		visual: <AuthorAvatar avatarUrl={ summary.avatarUrl } />,
		title: authorDisplayName( summary ),
		subTitle,
	};
}
