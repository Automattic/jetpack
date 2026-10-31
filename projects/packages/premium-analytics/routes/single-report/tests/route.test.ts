import {
	isDashboardSectionAvailable,
	isStatsFeatureLocked,
	needsReportDateParamsSeed,
	normalizeReportParams,
} from '@jetpack-premium-analytics/data';
import { isPremiumAnalyticsSiteConnected } from '../../site-readiness';
import { route } from '../route';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	isDashboardSectionAvailable: jest.fn( () => true ),
	isStatsFeatureLocked: jest.fn( () => false ),
	ensureCoreSettingsReady: jest.fn( () => Promise.resolve() ),
	computeDateRangeFromPreset: jest.fn( () => ( {
		from: '2021-01-01T00:00:00',
		to: '2026-06-16T23:59:59',
	} ) ),
	needsReportDateParamsSeed: jest.fn( () => false ),
	normalizeReportParams: jest.fn( ( search: Record< string, string | undefined > ) => ( {
		from: '2026-06-01T00:00:00',
		to: '2026-06-16T23:59:59',
		...search,
		comp: search.comp ?? 'previous_period',
	} ) ),
} ) );

jest.mock( '../../site-readiness', () => ( {
	isPremiumAnalyticsSiteConnected: jest.fn( () => true ),
} ) );

jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( ( options: object ) => ( { isRedirect: true, ...options } ) ),
} ) );

jest.mock( '../../stats-date-window', () => ( {
	limitStatsDateSearch: jest.fn( () => undefined ),
	dateWindowNotice: () => undefined,
} ) );

const VIDEO_PAGE = {
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

const AUTHOR_PAGE = {
	...VIDEO_PAGE,
	id: 'analytics/author',
	path: 'author',
	label: 'Author',
	feature: null,
	scope_param: 'author_id',
	reports_page: 'authors',
};

const POST_PAGE = {
	...VIDEO_PAGE,
	id: 'analytics/post',
	path: 'post',
	label: 'Post',
	feature: null,
	reports_page: 'posts',
	default_layout: [],
	sections: [
		{ slug: 'traffic', label: 'Traffic', default_layout: [], controls: null },
		{ slug: 'emails', label: 'Emails', default_layout: [], controls: [] },
	],
};

// A plugin's page behind a plan feature, with no reports page to fall back on.
const CLIP_PAGE = {
	...VIDEO_PAGE,
	id: 'demo/clip',
	path: 'clip',
	label: 'Clip',
	reports_page: null,
};

const settledSearch = {
	from: '2026-06-01T00:00:00',
	to: '2026-06-16T23:59:59',
	post_id: '42',
};

const beforeLoad = ( params?: object, search?: object ) =>
	route.beforeLoad( { params, search } as Parameters< typeof route.beforeLoad >[ 0 ] );

const video = { kind: 'video', id: '42' };

describe( 'single-report route.beforeLoad', () => {
	beforeAll( () => {
		Object.defineProperty( window, 'JetpackScriptData', {
			configurable: true,
			value: {
				premium_analytics: {
					single_report_pages: [ VIDEO_PAGE, AUTHOR_PAGE, POST_PAGE, CLIP_PAGE ],
				},
			},
		} );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	afterAll( () => {
		delete window.JetpackScriptData;
	} );

	it( 'redirects to /connect when the site is not connected', async () => {
		jest.mocked( isPremiumAnalyticsSiteConnected ).mockReturnValueOnce( false );

		await expect( beforeLoad( video ) ).rejects.toMatchObject( { to: '/connect' } );
	} );

	it( 'redirects home for a page nobody registered', async () => {
		await expect(
			beforeLoad( { kind: 'podcast', id: '42' }, settledSearch )
		).rejects.toMatchObject( { to: '/' } );
	} );

	it( 'redirects home when the page sits behind a hidden section', async () => {
		jest.mocked( isDashboardSectionAvailable ).mockReturnValueOnce( false );

		await expect( beforeLoad( video, settledSearch ) ).rejects.toMatchObject( { to: '/' } );
	} );

	it.each( [ undefined, '', 'abc', '-3', '0', '1.5' ] )(
		'redirects home for an invalid id (%p)',
		async id => {
			await expect( beforeLoad( { kind: 'video', id }, settledSearch ) ).rejects.toMatchObject( {
				to: '/',
			} );
		}
	);

	it( 'sends a plan-locked page to its reports page, keeping the window it was opened from', async () => {
		jest.mocked( isStatsFeatureLocked ).mockImplementationOnce( key => key === 'videos' );
		const search = {
			...settledSearch,
			ref_from: '2026-05-01T00:00:00',
			ref_to: '2026-05-31T23:59:59',
			ds: 'traffic',
		};

		await expect( beforeLoad( video, search ) ).rejects.toMatchObject( {
			to: '/reports/$report',
			params: { report: 'videos' },
			search: { from: search.ref_from, to: search.ref_to, ds: 'traffic' },
		} );
	} );

	it( 'sends a plan-locked page without a reports page home', async () => {
		jest.mocked( isStatsFeatureLocked ).mockImplementationOnce( key => key === 'videos' );

		await expect( beforeLoad( { kind: 'clip', id: '42' }, settledSearch ) ).rejects.toMatchObject( {
			to: '/',
		} );
	} );

	it( 'passes through a settled URL without redirecting', async () => {
		await expect( beforeLoad( video, settledSearch ) ).resolves.toBeUndefined();
	} );

	it( 'seeds the scope param into the URL when it does not match the path', async () => {
		await expect( beforeLoad( video, { ...settledSearch, post_id: '7' } ) ).rejects.toMatchObject( {
			to: '/report/$kind/$id',
			replace: true,
			params: { kind: 'video', id: '42' },
			search: expect.objectContaining( { post_id: '42' } ),
		} );
	} );

	it( 'drops a foreign scope while seeding its own', async () => {
		const redirect = beforeLoad( video, { ...settledSearch, post_id: '7', author_id: '3' } );

		await expect( redirect ).rejects.toMatchObject( { search: { post_id: '42' } } );
		await expect( redirect ).rejects.not.toHaveProperty( 'search.author_id' );
	} );

	it( 'seeds the scope param the page declares', async () => {
		const redirect = beforeLoad( { kind: 'author', id: '3' }, { ...settledSearch, post_id: '42' } );

		await expect( redirect ).rejects.toMatchObject( { search: { author_id: '3' } } );
		await expect( redirect ).rejects.not.toHaveProperty( 'search.post_id' );
	} );

	it( 'keeps the dashboard origin through the seeding redirect', async () => {
		jest
			.mocked( normalizeReportParams )
			.mockImplementationOnce( () => ( { from: '2026-06-01' } ) as never );

		await expect(
			beforeLoad( video, { ...settledSearch, post_id: '7', ds: 'insights' } )
		).rejects.toMatchObject( { search: { ds: 'insights', post_id: '42' } } );
	} );

	it( 'seeds when the date params are missing', async () => {
		jest.mocked( needsReportDateParamsSeed ).mockReturnValueOnce( true );

		await expect( beforeLoad( video, { post_id: '42' } ) ).rejects.toMatchObject( {
			to: '/report/$kind/$id',
			search: expect.objectContaining( { from: expect.any( String ), post_id: '42' } ),
		} );
	} );

	it( 'passes through comparison params without redirecting on a settled URL', async () => {
		await expect(
			beforeLoad( video, { ...settledSearch, comp: 'previous_period' } )
		).resolves.toBeUndefined();
	} );

	it( 'keeps its own range and the linking window when re-seeding a settled URL', async () => {
		jest.mocked( needsReportDateParamsSeed ).mockReturnValueOnce( true );

		const redirect = beforeLoad( video, {
			...settledSearch,
			preset: 'last-30-days',
			ref_from: '2026-05-01T00:00:00',
			ref_preset: 'last-month',
		} );

		await expect( redirect ).rejects.toMatchObject( {
			search: {
				from: '2026-06-01T00:00:00',
				preset: 'last-30-days',
				ref_from: '2026-05-01T00:00:00',
				ref_preset: 'last-month',
			},
		} );
	} );

	it( 'replaces a section the page does not have with its first one', async () => {
		await expect(
			beforeLoad( { kind: 'post', id: '42' }, { ...settledSearch, section: 'bogus' } )
		).rejects.toMatchObject( { search: expect.objectContaining( { section: 'traffic' } ) } );
	} );

	it.each( [ { section: 'emails' }, {} ] )(
		'passes through a settled URL on a page with sections (%p)',
		async section => {
			await expect(
				beforeLoad( { kind: 'post', id: '42' }, { ...settledSearch, ...section } )
			).resolves.toBeUndefined();
		}
	);
} );
