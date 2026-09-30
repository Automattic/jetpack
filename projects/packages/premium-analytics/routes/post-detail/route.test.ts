import { ensureCoreSettingsReady } from '@jetpack-premium-analytics/data';
import { redirect } from '@wordpress/route';
import { isDashboardSectionAvailable, isPremiumAnalyticsSiteConnected } from '../site-readiness';
import { route } from './route';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	ensureCoreSettingsReady: jest.fn(),
} ) );

jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( options => options ),
} ) );
jest.mock( '../site-readiness', () => ( {
	isPremiumAnalyticsSiteConnected: jest.fn( () => true ),
	isDashboardSectionAvailable: jest.fn( () => true ),
} ) );
jest.mock( './config', () => ( {
	resolveTabId: ( section: string ) => section,
} ) );

const mockEnsureCoreSettingsReady = ensureCoreSettingsReady as jest.MockedFunction<
	typeof ensureCoreSettingsReady
>;
const mockRedirect = redirect as jest.MockedFunction< typeof redirect >;

const seededSearch = {
	from: '2026-06-01',
	to: '2026-06-16',
	interval: 'day',
	post_id: '42',
};

describe( 'post detail route report origin', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mockEnsureCoreSettingsReady.mockResolvedValue( undefined );
	} );

	it( 'carries the report origin through the seeding redirect', async () => {
		await expect(
			route.beforeLoad( {
				params: { postId: '42' },
				search: {
					...seededSearch,
					post_id: undefined,
					ref: 'comments',
					ref_section: 'posts',
					ds: 'insights',
				},
			} )
		).rejects.toMatchObject( {
			to: '/post/$postId',
			replace: true,
			search: {
				post_id: '42',
				ref: 'comments',
				ref_section: 'posts',
				ds: 'insights',
			},
		} );

		expect( mockRedirect ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'opens a linked post on all time and keeps the linking window for the way back', async () => {
		let thrown: { search?: Record< string, unknown > } | undefined;
		try {
			await route.beforeLoad( {
				params: { postId: '42' },
				search: {
					from: '2026-06-10',
					to: '2026-06-16',
					interval: 'day',
					preset: 'last-7-days',
					comp: '1',
					compare_from: '2026-06-03',
					compare_to: '2026-06-09',
					compare_preset: 'previous-period',
				},
			} );
		} catch ( error ) {
			thrown = error as { search?: Record< string, unknown > };
		}

		expect( thrown?.search ).toMatchObject( {
			preset: 'all-time',
			ref_from: '2026-06-10',
			ref_to: '2026-06-16',
			ref_interval: 'day',
			ref_preset: 'last-7-days',
			ref_comp: '1',
			ref_compare_from: '2026-06-03',
			ref_compare_to: '2026-06-09',
			ref_compare_preset: 'previous-period',
		} );
		expect( thrown?.search?.from ).not.toBe( '2026-06-10' );
		expect( thrown?.search ).not.toHaveProperty( 'comp' );
	} );

	it( 'keeps no linking window when the link itself was on all time', async () => {
		let thrown: { search?: Record< string, unknown > } | undefined;
		try {
			await route.beforeLoad( {
				params: { postId: '42' },
				search: { from: '2026-01-01', to: '2026-06-16', interval: 'month', preset: 'all-time' },
			} );
		} catch ( error ) {
			thrown = error as { search?: Record< string, unknown > };
		}

		expect( thrown?.search ).toMatchObject( { preset: 'all-time', post_id: '42' } );
		expect( Object.keys( thrown?.search ?? {} ).filter( key => key.startsWith( 'ref_' ) ) ).toEqual(
			[]
		);
	} );

	it( 'keeps the page its own range and the linking window when re-seeding a settled URL', async () => {
		let thrown: { search?: Record< string, unknown > } | undefined;
		try {
			await route.beforeLoad( {
				params: { postId: '42' },
				search: {
					...seededSearch,
					// A 16-day range cannot bucket by month, so the interval is re-seeded.
					interval: 'month',
					ref_from: '2026-05-01',
					ref_to: '2026-05-31',
					ref_preset: 'last-month',
				},
			} );
		} catch ( error ) {
			thrown = error as { search?: Record< string, unknown > };
		}

		expect( thrown?.search ).toMatchObject( {
			from: '2026-06-01',
			to: '2026-06-16',
			interval: 'day',
			ref_from: '2026-05-01',
			ref_to: '2026-05-31',
			ref_preset: 'last-month',
		} );
	} );

	// Uses the real normalizer, which keeps a valid `author_id`: the seed has to
	// drop it, or an author page link would scope this page's URL to an author.
	it( 'drops an author scope while seeding the post scope', async () => {
		let thrown: { search?: Record< string, unknown > } | undefined;
		try {
			await route.beforeLoad( {
				params: { postId: '42' },
				search: { ...seededSearch, post_id: '7', author_id: '3' },
			} );
		} catch ( error ) {
			thrown = error as { search?: Record< string, unknown > };
		}

		expect( thrown?.search ).toMatchObject( { post_id: '42' } );
		expect( thrown?.search ).not.toHaveProperty( 'author_id' );
	} );

	it( 'does not redirect when a seeded search already carries the origin', async () => {
		await expect(
			route.beforeLoad( {
				params: { postId: '42' },
				search: { ...seededSearch, ref: 'comments', ref_section: 'posts' },
			} )
		).resolves.toBeUndefined();

		expect( mockRedirect ).not.toHaveBeenCalled();
	} );

	it( 'redirects to /connect when the site is not connected', async () => {
		( isPremiumAnalyticsSiteConnected as jest.Mock ).mockReturnValueOnce( false );

		await expect(
			route.beforeLoad( { params: { postId: '42' }, search: seededSearch } )
		).rejects.toMatchObject( { to: '/connect' } );
	} );

	it.each( [ undefined, '', 'abc', '-3', '0', '1.5' ] )(
		'redirects home for an invalid postId (%p)',
		async postId => {
			await expect(
				route.beforeLoad( { params: { postId }, search: seededSearch } )
			).rejects.toMatchObject( { to: '/' } );
		}
	);

	it( 'redirects home when the All pages report is behind a hidden tab', async () => {
		( isDashboardSectionAvailable as jest.Mock ).mockReturnValueOnce( false );

		await expect(
			route.beforeLoad( {
				params: { postId: '42' },
				search: seededSearch,
			} )
		).rejects.toMatchObject( { to: '/' } );
	} );

	it( 'does not redirect when the shareable search is fully seeded and clean', async () => {
		await expect(
			route.beforeLoad( {
				params: { postId: '42' },
				search: seededSearch,
			} )
		).resolves.toBeUndefined();

		expect( mockRedirect ).not.toHaveBeenCalled();
	} );
} );
