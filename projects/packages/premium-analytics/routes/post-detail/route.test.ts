import { ensureCoreSettingsReady } from '@jetpack-premium-analytics/data';
import { redirect } from '@wordpress/route';
import {
	isDashboardSectionInPreviewScope,
	isPremiumAnalyticsSiteConnected,
} from '../site-readiness';
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
	isDashboardSectionInPreviewScope: jest.fn( () => true ),
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
				},
			} )
		).rejects.toMatchObject( {
			to: '/post/$postId',
			replace: true,
			search: {
				from: '2026-06-01',
				to: '2026-06-16',
				interval: 'day',
				post_id: '42',
				ref: 'comments',
				ref_section: 'posts',
			},
		} );

		expect( mockRedirect ).toHaveBeenCalledTimes( 1 );
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
		( isDashboardSectionInPreviewScope as jest.Mock ).mockReturnValueOnce( false );

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
