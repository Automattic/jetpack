import { render, screen } from '@testing-library/react';
import { useFreeTier } from '../../../src/dashboard/hooks/use-free-tier';
import { useVideoPressUpgrade } from '../../../src/dashboard/hooks/use-videopress-upgrade';
import { stage as Stage } from '../stage';
import type { FreeTierState } from '../../../src/dashboard/hooks/use-free-tier';
import type { ReactNode } from 'react';

jest.mock( '../../../src/dashboard/hooks/use-available-license-count', () => ( {
	useAvailableLicenseCount: () => 0,
} ) );

jest.mock( '../../../src/dashboard/components/dashboard-layout', () => ( {
	__esModule: true,
	default: ( { children }: { children?: ReactNode } ) => <div>{ children }</div>,
} ) );

jest.mock( '../../../src/dashboard/components/query-client-wrapper', () => ( {
	__esModule: true,
	default: ( { children }: { children: ReactNode } ) => <>{ children }</>,
} ) );

// The stats cards have their own tests; here they only need to stay out of
// the way of the notice under test.
jest.mock( '../../../src/dashboard/components/overview/kpi-cards-row', () => () => null );
jest.mock( '../../../src/dashboard/components/overview/most-viewed-card', () => () => null );
jest.mock( '../../../src/dashboard/components/overview/storage-meter-card', () => () => null );
jest.mock( '../../../src/dashboard/components/overview/top-by-watch-time-card', () => () => null );
jest.mock( '../../../src/dashboard/components/overview/views-trends-card', () => () => null );

jest.mock( '../../../src/dashboard/hooks/use-stats', () => ( {
	useStats: () => ( {
		stats: {
			views: 0,
			impressions: 0,
			watchTimeSeconds: 0,
			series: [],
			topVideos: [],
			topVideosByWatchTime: [],
		},
		isLoading: false,
		isError: false,
		error: null,
		hasData: true,
		refetch: jest.fn(),
		dateRange: 'last_30_days',
		setDateRange: jest.fn(),
		granularity: 'day',
		setGranularity: jest.fn(),
		activeMetric: 'views',
		setActiveMetric: jest.fn(),
		compare: false,
		setCompare: jest.fn(),
	} ),
} ) );

// Free-tier state is what the tests steer; the notice's checkout wiring is
// covered by the FreeTierNotice component tests.
jest.mock( '../../../src/dashboard/hooks/use-free-tier', () => ( {
	useFreeTier: jest.fn(),
} ) );
jest.mock( '../../../src/dashboard/hooks/use-videopress-upgrade', () => ( {
	useVideoPressUpgrade: jest.fn( () => jest.fn() ),
} ) );

const mockedUseFreeTier = useFreeTier as jest.Mock;

const freeTierState = ( overrides: Partial< FreeTierState > = {} ): FreeTierState => ( {
	isFree: true,
	isAtomic: false,
	isUnlimited: false,
	videoCount: 0,
	videoCountKnown: true,
	limit: 1,
	isAtLimit: false,
	...overrides,
} );

const FREE_PLAN_COPY =
	'You’re on the free plan, which allows 1 video upload. Upgrade for more storage and unlimited uploads.';
const AT_LIMIT_COPY = 'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.';

describe( 'Overview stage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
	} );

	it( 'shows the free-plan notice while the free upload is still available', () => {
		mockedUseFreeTier.mockReturnValue( freeTierState() );

		render( <Stage /> );

		expect( screen.getByText( FREE_PLAN_COPY ) ).toBeInTheDocument();
		expect( screen.queryByText( AT_LIMIT_COPY ) ).not.toBeInTheDocument();
		expect( useVideoPressUpgrade ).toHaveBeenCalledWith( 'overview' );
	} );

	it( 'says the limit is reached once the free upload is used', () => {
		mockedUseFreeTier.mockReturnValue( freeTierState( { videoCount: 1, isAtLimit: true } ) );

		render( <Stage /> );

		expect( screen.getByText( AT_LIMIT_COPY ) ).toBeInTheDocument();
		expect( screen.queryByText( FREE_PLAN_COPY ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toBeInTheDocument();
		expect( useVideoPressUpgrade ).toHaveBeenCalledWith( 'overview' );
	} );

	it( 'shows no upgrade notice on a paid plan', () => {
		mockedUseFreeTier.mockReturnValue( freeTierState( { isFree: false, videoCount: 3 } ) );

		render( <Stage /> );

		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );
} );
