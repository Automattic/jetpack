import { ensureCoreSettingsReady } from '@jetpack-premium-analytics/data';
import { select } from '@wordpress/data';
import { redirect } from '@wordpress/route';
import { route } from './route';

jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	ensureCoreSettingsReady: jest.fn(),
} ) );

jest.mock( '@wordpress/core-data', () => ( { store: {} } ) );
jest.mock( '@wordpress/data', () => ( {
	dispatch: jest.fn(),
	select: jest.fn(),
} ) );
jest.mock( '@wordpress/route', () => ( {
	redirect: jest.fn( options => options ),
} ) );
jest.mock( '../site-readiness', () => ( {
	isPremiumAnalyticsInitialSyncFinished: () => true,
	isPremiumAnalyticsSiteConnected: () => true,
} ) );
jest.mock( './config', () => ( {
	resolveTabId: ( section: string ) => section,
} ) );

const mockEnsureCoreSettingsReady = ensureCoreSettingsReady as jest.MockedFunction<
	typeof ensureCoreSettingsReady
>;
const mockSelect = select as jest.MockedFunction< typeof select >;
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
		mockSelect.mockReturnValue( {
			getEntityConfig: () => ( {} ),
			getEntityRecord: () => undefined,
		} as never );
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

	it( 'does not redirect when a seeded search already carries the origin', async () => {
		await expect(
			route.beforeLoad( {
				params: { postId: '42' },
				search: { ...seededSearch, ref: 'comments', ref_section: 'posts' },
			} )
		).resolves.toBeUndefined();

		expect( mockRedirect ).not.toHaveBeenCalled();
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
