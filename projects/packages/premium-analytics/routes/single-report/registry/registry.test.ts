import { isDashboardSectionAvailable } from '@jetpack-premium-analytics/data';
import {
	getSingleReportLayout,
	getSingleReportPage,
	isValidEntityId,
	resolveSingleReportControls,
	resolveSingleReportSection,
	type SingleReportPageRecord,
} from './registry';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	isDashboardSectionAvailable: jest.fn( () => true ),
} ) );

const VIDEO_PAGE: SingleReportPageRecord = {
	id: 'analytics/video',
	path: 'video',
	label: 'Video',
	dashboard_section: 'traffic',
	feature: 'videos',
	scope_param: 'post_id',
	id_pattern: '^[1-9]\\d*$',
	icon: 'jpa/video',
	controls: null,
	reports_page: 'videos',
	preferences_scope: 'jetpack-premium-analytics/video-detail',
	default_layout: [ { uuid: 'embeds', type: 'jpa/video-detail-embeds' } ],
	sections: [],
};

const POST_PAGE: SingleReportPageRecord = {
	...VIDEO_PAGE,
	id: 'analytics/post',
	path: 'post',
	label: 'Post',
	dashboard_section: null,
	default_layout: [],
	sections: [
		{
			slug: 'traffic',
			label: 'Traffic',
			default_layout: [ { uuid: 'a', type: 'jpa/a' } ],
			controls: null,
		},
		{
			slug: 'emails',
			label: 'Emails',
			default_layout: [ { uuid: 'b', type: 'jpa/b' } ],
			controls: [],
		},
	],
};

/**
 * Publishes the given pages the way the server does, in the script data.
 *
 * @param pages - The page records, or undefined for a server without the API.
 */
function setPages( pages: unknown[] | undefined ) {
	Object.defineProperty( window, 'JetpackScriptData', {
		configurable: true,
		value: { premium_analytics: pages ? { single_report_pages: pages } : {} },
	} );
}

describe( 'getSingleReportPage', () => {
	afterEach( () => {
		jest.clearAllMocks();
		delete window.JetpackScriptData;
	} );

	it( 'finds the page a URL segment names', () => {
		setPages( [ VIDEO_PAGE, POST_PAGE ] );

		expect( getSingleReportPage( 'post' ) ).toEqual( POST_PAGE );
	} );

	it.each( [
		[ 'no segment', undefined, [ VIDEO_PAGE ] ],
		[ 'an unknown segment', 'author', [ VIDEO_PAGE ] ],
		[ 'no pages in the script data', 'video', undefined ],
	] )( 'answers nothing for %s', ( _case, kind, pages ) => {
		setPages( pages );

		expect( getSingleReportPage( kind ) ).toBeUndefined();
	} );

	it( 'hides a page whose dashboard section the reader cannot open', () => {
		setPages( [ VIDEO_PAGE ] );
		jest.mocked( isDashboardSectionAvailable ).mockReturnValueOnce( false );

		expect( getSingleReportPage( 'video' ) ).toBeUndefined();
		expect( isDashboardSectionAvailable ).toHaveBeenCalledWith( 'traffic' );
	} );
} );

describe( 'isValidEntityId', () => {
	it.each( [ '1', '42', '1000' ] )( 'accepts %p against the numeric pattern', id => {
		expect( isValidEntityId( VIDEO_PAGE, id ) ).toBe( true );
	} );

	it.each( [ undefined, '', '0', 'abc', '-3', '1.5' ] )( 'rejects %p', id => {
		expect( isValidEntityId( VIDEO_PAGE, id ) ).toBe( false );
	} );

	it( 'honours a page-specific pattern', () => {
		const page = { ...VIDEO_PAGE, id_pattern: '^[a-z-]+$' };

		expect( isValidEntityId( page, 'launch-recap' ) ).toBe( true );
		expect( isValidEntityId( page, '42' ) ).toBe( false );
	} );

	it( 'falls back to positive integers when the pattern does not compile', () => {
		const page = { ...VIDEO_PAGE, id_pattern: '[' };

		expect( isValidEntityId( page, '42' ) ).toBe( true );
		expect( isValidEntityId( page, 'abc' ) ).toBe( false );
	} );
} );

describe( 'resolveSingleReportSection', () => {
	it( 'answers nothing for a page with one layout', () => {
		expect( resolveSingleReportSection( VIDEO_PAGE, 'traffic' ) ).toBeUndefined();
		expect( getSingleReportLayout( VIDEO_PAGE, undefined ) ).toBe( VIDEO_PAGE.default_layout );
	} );

	it( 'resolves the named section and its layout', () => {
		const section = resolveSingleReportSection( POST_PAGE, 'emails' );

		expect( section?.slug ).toBe( 'emails' );
		expect( getSingleReportLayout( POST_PAGE, section ) ).toBe(
			POST_PAGE.sections[ 1 ].default_layout
		);
	} );

	it.each( [ undefined, 'bogus' ] )( 'falls back to the first section for %p', value => {
		expect( resolveSingleReportSection( POST_PAGE, value )?.slug ).toBe( 'traffic' );
	} );
} );

describe( 'resolveSingleReportControls', () => {
	const page = {
		...POST_PAGE,
		controls: [
			{
				id: 'range',
				type: 'jpa/report-params',
				elements: [ { value: 'last-7-days', label: 'Last 7 days' } ],
			},
		],
	};

	it( 'lets a section override the page, and inherit it with null', () => {
		expect( resolveSingleReportControls( page, page.sections[ 1 ] ) ).toEqual( [] );
		expect( resolveSingleReportControls( page, page.sections[ 0 ] ) ).toBe( page.controls );
		expect( resolveSingleReportControls( VIDEO_PAGE, undefined ) ).toBeNull();
	} );
} );
