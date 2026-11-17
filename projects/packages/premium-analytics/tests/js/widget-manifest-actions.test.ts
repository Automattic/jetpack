/**
 * External dependencies
 */
import { buildDashboardHref } from '@jetpack-premium-analytics/routing';
/**
 * Internal dependencies
 */
import annualHighlights from '../../widgets/annual-highlights/widget.json';
import authorTopPosts from '../../widgets/author-top-posts/widget.json';
import authors from '../../widgets/authors/widget.json';
import clicks from '../../widgets/clicks/widget.json';
import emails from '../../widgets/emails/widget.json';
import fileDownloads from '../../widgets/file-downloads/widget.json';
import mostCommentedAuthors from '../../widgets/most-commented-authors/widget.json';
import mostCommentedPosts from '../../widgets/most-commented-posts/widget.json';
import referrers from '../../widgets/referrers/widget.json';
import searchTerms from '../../widgets/search-terms/widget.json';
import tags from '../../widgets/tags/widget.json';

type Manifest = { name: string; actions?: unknown };

// Every widget whose "View all" target is fixed declares it in its manifest, as the portable
// href of its report, which the host reads back as the in-app route.
const VIEW_ALL: Array< [ Manifest, string, Record< string, string > | undefined ] > = [
	[ annualHighlights, '/reports/annual-insights', undefined ],
	[ authorTopPosts, '/reports/authors', undefined ],
	[ authors, '/reports/authors', undefined ],
	[ clicks, '/reports/clicks', undefined ],
	[ emails, '/reports/emails', undefined ],
	[ fileDownloads, '/reports/downloads', undefined ],
	[ mostCommentedAuthors, '/reports/comments', { section: 'authors' } ],
	[ mostCommentedPosts, '/reports/comments', { section: 'posts' } ],
	[ referrers, '/reports/referrers', undefined ],
	[ searchTerms, '/reports/search-terms', undefined ],
	[ tags, '/reports/tags', undefined ],
];

describe( 'widget.json View all actions', () => {
	it.each( VIEW_ALL )( '$name declares View all to its report', ( manifest, route, search ) => {
		expect( manifest.actions ).toEqual( [
			{
				id: 'view-all',
				label: 'View all',
				relevance: 'high',
				href: buildDashboardHref( route, search ),
			},
		] );
	} );
} );
