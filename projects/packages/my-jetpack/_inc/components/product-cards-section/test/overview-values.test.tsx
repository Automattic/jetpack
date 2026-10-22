import { render, screen } from '@testing-library/react';
import BackupOverviewItem from '../backup-card/overview';
import VideoPressOverviewItem from '../videopress-card/overview';

let mockDetail: Record< string, unknown > = {};
let mockQueryData: unknown;
const mockLoadEvent = jest.fn();

jest.mock( '../../../hooks/use-analytics', () => () => ( { recordEvent: jest.fn() } ) );
jest.mock( '../../../data/products/use-product', () => () => ( {
	detail: { name: 'Product', ...mockDetail },
	isLoading: false,
} ) );
jest.mock( '../../../data/products/use-products-by-ownership', () => () => ( {
	data: { ownedProducts: [ 'backup', 'videopress' ] },
} ) );
jest.mock( '../../../data/use-simple-query', () => () => ( {
	data: mockQueryData,
	isLoading: false,
} ) );
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
	beforeEach( () => mockLoadEvent.mockClear() );

	it( 'sends Backup turned off by support to support instead of activating it', () => {
		mockDetail = {
			status: 'inactive',
			doesModuleNeedAttention: { data: { status: 'backups-deactivated' } },
		};
		mockQueryData = undefined;
		render( <BackupOverviewItem admin /> );

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
} );
