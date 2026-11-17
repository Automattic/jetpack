/**
 * Internal dependencies
 */
import { getPostReportKind } from '../single-report-pages';

const POST_PAGE = { path: 'post', entity: { kind: 'postType', name: 'post' } };
const PAGE_PAGE = { path: 'page', entity: { kind: 'postType', name: 'page' } };

afterEach( () => {
	delete window.JetpackScriptData;
} );

describe( 'getPostReportKind', () => {
	it.each( [
		[ 'the page bound to the type', [ POST_PAGE, PAGE_PAGE ], 'page', 'page' ],
		[ 'the post page for a type without a page', [ POST_PAGE, PAGE_PAGE ], 'attachment', 'post' ],
		[ 'the post page for a row without a type', [ POST_PAGE, PAGE_PAGE ], undefined, 'post' ],
		[ 'the post page when the records name no entity', [ { path: 'page' } ], 'page', 'post' ],
		[ 'the post page when no page was published', undefined, 'page', 'post' ],
	] )( 'returns %s', ( _case, pages, postType, kind ) => {
		Object.defineProperty( window, 'JetpackScriptData', {
			configurable: true,
			value: { premium_analytics: { single_report_pages: pages } },
		} );

		expect( getPostReportKind( postType ) ).toBe( kind );
	} );
} );
