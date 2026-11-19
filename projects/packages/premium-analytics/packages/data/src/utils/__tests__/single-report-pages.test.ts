/**
 * Internal dependencies
 */
import { getPostReportKind } from '../single-report-pages';

const POST_PAGE = { path: 'post', entity: { kind: 'postType', name: 'post' } };
const PAGE_PAGE = {
	path: 'page',
	entity: { kind: 'postType', name: 'page' },
	dashboard_section: 'traffic',
};
const PRODUCT_PAGE = {
	path: 'product',
	entity: { kind: 'postType', name: 'product' },
	dashboard_section: 'store',
};

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
		[
			'the post page for a type whose page is behind a section the reader cannot open',
			[ POST_PAGE, PRODUCT_PAGE ],
			'product',
			'post',
		],
	] )( 'returns %s', ( _case, pages, postType, kind ) => {
		Object.defineProperty( window, 'JetpackScriptData', {
			configurable: true,
			value: { premium_analytics: { sections: [ 'traffic' ], single_report_pages: pages } },
		} );

		expect( getPostReportKind( postType ) ).toBe( kind );
	} );
} );
