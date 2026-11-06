import { render, screen } from '@testing-library/react';
import BackupOverviewItem from '../backup-card/overview';
import VideoPressOverviewItem from '../videopress-card/overview';

let mockDetail: Record< string, unknown > = {};
let mockQueryData: unknown;
let mockQueryError: { code: string } | null = null;
const mockLoadEvent = jest.fn();

jest.mock( '../../../hooks/use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../../data/products/use-product', () => () => ( {
	detail: { name: 'Product', ...mockDetail },
	isLoading: false,
} ) );
jest.mock( '../../../data/products/use-products-by-ownership', () => () => ( {
	data: { ownedProducts: [ 'backup', 'videopress' ] },
} ) );
let mockQueryEnabled: boolean | undefined;
jest.mock(
	'../../../data/use-simple-query',
	() =>
		( { options }: { options?: { enabled?: boolean } } ) => {
			mockQueryEnabled = options?.enabled ?? true;
			return {
				data: mockQueryData,
				isLoading: false,
				isFetching: false,
				isError: !! mockQueryError,
				error: mockQueryError,
				refetch: jest.fn(),
			};
		}
);
jest.mock(
	'../../../hooks/use-notification-watcher/use-get-readable-failed-backup-reason',
	() => () => ( {} )
);
jest.mock( '../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { siteUrl: 'example.org' } ),
} ) );
jest.mock( '../overview-item/use-status-action', () => () => ( {
	action: { label: 'Activate Product', onClick: jest.fn() },
	forcedOffReason: null,
} ) );
jest.mock(
	'../overview-item/use-overview-load-event',
	() =>
		( ...args: unknown[] ) =>
			mockLoadEvent( ...args )
);

describe( 'Overview items with their card values', () => {
	beforeEach( () => {
		mockLoadEvent.mockClear();
		mockQueryError = null;
	} );

	it( 'sends anyone to support for Backup turned off by support, instead of activating it', () => {
		mockDetail = {
			status: 'inactive',
			doesModuleNeedAttention: { data: { status: 'backups-deactivated' } },
		};
		mockQueryData = undefined;
		render( <BackupOverviewItem admin={ false } /> );

		expect( screen.getByText( 'Contact support to reactivate' ) ).toBeInTheDocument();
		expect( screen.queryByText( 'Activate Product' ) ).not.toBeInTheDocument();
	} );

	it( "shows VideoPress's existing videos and adds them to the load event while it's off", () => {
		mockDetail = { status: 'inactive' };
		mockQueryData = { videoCount: 12, featuredStats: { period: 'day' } };
		render( <VideoPressOverviewItem admin /> );

		expect( screen.getByText( 'Existing videos' ) ).toBeInTheDocument();
		expect( screen.getByText( '12' ) ).toBeInTheDocument();
		expect( mockLoadEvent ).toHaveBeenCalledWith( 'videopress', false, {
			stats_period: 'day',
			video_count: 12,
		} );
	} );

	it.each( [
		{ product: 'Backup', Item: BackupOverviewItem, admin: true, queries: true, shown: 1 },
		{ product: 'Backup', Item: BackupOverviewItem, admin: false, queries: false, shown: 0 },
		{ product: 'VideoPress', Item: VideoPressOverviewItem, admin: true, queries: true, shown: 1 },
		{ product: 'VideoPress', Item: VideoPressOverviewItem, admin: false, queries: true, shown: 1 },
	] )(
		'queries $product for an admin: $admin ($queries) and shows its failure $shown times',
		( { Item, admin, queries, shown } ) => {
			mockDetail = { status: 'active' };
			mockQueryData = undefined;
			mockQueryError = { code: 'failed' };
			render( <Item admin={ admin } /> );

			expect( mockQueryEnabled ).toBe( queries );
			expect( screen.queryAllByText( /^Failed to load/ ) ).toHaveLength( shown );
		}
	);
} );
