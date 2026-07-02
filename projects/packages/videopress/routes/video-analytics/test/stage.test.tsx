import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useChannelAverages, useVideoStats } from '../../../src/dashboard/hooks/use-stats';
import { useVideo } from '../../../src/dashboard/hooks/use-video';
import { useVideoPages } from '../../../src/dashboard/hooks/use-video-pages';
import { makeLibraryItem } from '../../../src/dashboard/test-utils/library-item';
import { stage as Stage } from '../stage';
import type { ChannelAverages, VideoStats } from '../../../src/dashboard/types/stats';

jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useParams: () => ( { id: '42' } ),
	useNavigate: () => jest.fn(),
	Link: ( { to, children } ) => <a href={ to }>{ children }</a>,
} ) );

// The heavy page chrome is out of scope here: AdminPage pulls in the REST
// bootstrapping and Breadcrumbs its own stylesheet pipeline. Stub both to
// structural passthroughs so the tests exercise the stage's own states.
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { breadcrumbs, actions, children } ) => (
		<div>
			{ breadcrumbs }
			{ actions }
			{ children }
		</div>
	),
} ) );

jest.mock( '@wordpress/admin-ui', () => ( {
	__esModule: true,
	Breadcrumbs: ( { items } ) => (
		<nav aria-label="Breadcrumbs">
			{ items.map( item => (
				<span key={ String( item.label ) }>{ item.label }</span>
			) ) }
		</nav>
	),
} ) );

jest.mock( '@automattic/charts', () => ( {
	__esModule: true,
	LineChart: () => <div data-testid="line-chart" />,
} ) );

// ViewsTrendsCard's SelectControls trip @wordpress/components' 36px
// default-size deprecation warning, which @wordpress/jest-console turns
// into a failure. The deprecation belongs to the shared card (also used
// on the Overview), not to this stage, so stub just SelectControl with a
// plain <select>; everything else (DateRangeSelector's Dropdown etc.)
// stays real.
jest.mock( '@wordpress/components', () => ( {
	...jest.requireActual( '@wordpress/components' ),
	SelectControl: ( { label, value, options = [], onChange } ) => (
		<select
			aria-label={ label }
			value={ value }
			onChange={ event => onChange( event.target.value ) }
		>
			{ options.map( option => (
				<option key={ option.value } value={ option.value }>
					{ option.label }
				</option>
			) ) }
		</select>
	),
} ) );

jest.mock( '../../../src/dashboard/components/query-client-wrapper', () => ( {
	__esModule: true,
	default: ( { children } ) => <>{ children }</>,
} ) );

jest.mock( '../../../src/dashboard/hooks/use-video', () => ( {
	__esModule: true,
	useVideo: jest.fn(),
} ) );

jest.mock( '../../../src/dashboard/hooks/use-stats', () => ( {
	__esModule: true,
	useVideoStats: jest.fn(),
	useChannelAverages: jest.fn(),
} ) );

jest.mock( '../../../src/dashboard/hooks/use-video-pages', () => ( {
	__esModule: true,
	useVideoPages: jest.fn(),
} ) );

const mockUseVideo = useVideo as jest.Mock;
const mockUseVideoStats = useVideoStats as jest.Mock;
const mockUseChannelAverages = useChannelAverages as jest.Mock;
const mockUseVideoPages = useVideoPages as jest.Mock;

const STATS: VideoStats = {
	views: { current: 1234, previousPeriod: 1000 },
	impressions: { current: 5678, previousPeriod: 5000 },
	watchTimeSeconds: { current: 7200, previousPeriod: 3600 },
	retentionRate: { current: 87.5, previousPeriod: 80 },
	series: [],
};

const CHANNEL: ChannelAverages = {
	videoCount: 3,
	views: 400,
	impressions: 2000,
	watchTimeSeconds: 5400,
	retentionRate: 60,
};

type InitialState = { features?: { studio?: boolean } };
const globals = window as unknown as { JPVIDEOPRESS_INITIAL_STATE?: InitialState };

describe( 'video-analytics stage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		globals.JPVIDEOPRESS_INITIAL_STATE = { features: { studio: true } };
		mockUseVideo.mockReturnValue( { video: makeLibraryItem(), isLoading: false } );
		mockUseVideoStats.mockReturnValue( { stats: STATS, isLoading: false, isError: false } );
		mockUseChannelAverages.mockReturnValue( {
			averages: CHANNEL,
			isLoading: false,
			isError: false,
		} );
		mockUseVideoPages.mockReturnValue( {
			pages: [ 'https://example.com/my-post' ],
			isLoading: false,
			isError: false,
		} );
	} );

	afterEach( () => {
		delete globals.JPVIDEOPRESS_INITIAL_STATE;
	} );

	it( 'renders the not-found state when the Studio flag is off', () => {
		delete globals.JPVIDEOPRESS_INITIAL_STATE;
		render( <Stage /> );

		expect( screen.getByText( "We couldn't find that page." ) ).toBeInTheDocument();
	} );

	it( 'keeps the page chrome with a Loading crumb while the video resolves', () => {
		mockUseVideo.mockReturnValue( { video: undefined, isLoading: true } );
		render( <Stage /> );

		expect( screen.getByText( 'Loading…' ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'tab' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the not-found state when the id does not resolve', () => {
		mockUseVideo.mockReturnValue( { video: undefined, isLoading: false } );
		render( <Stage /> );

		expect( screen.getByText( "We couldn't find that page." ) ).toBeInTheDocument();
	} );

	it( 'renders the not-found state for local (non-VideoPress) items', () => {
		mockUseVideo.mockReturnValue( {
			video: makeLibraryItem( { type: 'local', guid: '' } ),
			isLoading: false,
		} );
		render( <Stage /> );

		expect( screen.getByText( "We couldn't find that page." ) ).toBeInTheDocument();
	} );

	it( 'renders the no-data-yet state while the video is processing', () => {
		mockUseVideo.mockReturnValue( {
			video: makeLibraryItem( { isProcessing: true } ),
			isLoading: false,
		} );
		render( <Stage /> );

		expect(
			screen.getByText( 'This video is still processing. Analytics will appear once it’s ready.' )
		).toBeInTheDocument();
		expect( screen.queryByTestId( 'line-chart' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the four KPI tabs, the trends chart, and both bottom cards when ready', () => {
		render( <Stage /> );

		// The four KPI tabs, distinct from the video sub-nav's tabs. The
		// accessible names concatenate label and value runs without
		// separators, e.g. "VIEWS1,23423%".
		expect( screen.getByRole( 'tab', { name: /VIEWS1,234/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /IMPRESSIONS5,678/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /WATCH TIME2\.0 h/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: /RETENTION87\.5%/ } ) ).toBeInTheDocument();

		expect( screen.getByTestId( 'line-chart' ) ).toBeInTheDocument();

		expect( screen.getByRole( 'link', { name: /example\.com\/my-post/ } ) ).toBeInTheDocument();
		expect(
			screen.getByRole( 'table', { name: 'Compared to channel average' } )
		).toBeInTheDocument();

		// Per-video hooks receive the routed id via the resolved video.
		expect( mockUseVideoStats ).toHaveBeenCalledWith( '42', 'last_30_days', 'days' );
		expect( mockUseVideoPages ).toHaveBeenCalledWith( '42' );
	} );

	it( 'replaces the KPI/chart region and comparison table when the stats queries fail', () => {
		mockUseVideoStats.mockReturnValue( { stats: STATS, isLoading: false, isError: true } );
		mockUseChannelAverages.mockReturnValue( {
			averages: CHANNEL,
			isLoading: false,
			isError: true,
		} );
		render( <Stage /> );

		// Zeroed KPIs are indistinguishable from a genuinely zero-view
		// video, so an explicit error card takes over the region.
		expect( screen.getByText( /Could not load stats for this period/ ) ).toBeInTheDocument();
		expect( screen.queryByRole( 'tab', { name: /VIEWS/ } ) ).not.toBeInTheDocument();
		expect( screen.queryByTestId( 'line-chart' ) ).not.toBeInTheDocument();
		expect( screen.getByText( 'Could not load the channel comparison.' ) ).toBeInTheDocument();
		expect(
			screen.queryByRole( 'table', { name: 'Compared to channel average' } )
		).not.toBeInTheDocument();

		// The pages card has its own independent fetch and stays rendered.
		expect( screen.getByRole( 'link', { name: /example\.com\/my-post/ } ) ).toBeInTheDocument();
	} );

	it( 'swaps the chart for the retention explanation when Retention is selected', async () => {
		const user = userEvent.setup();
		render( <Stage /> );

		await user.click( screen.getByRole( 'tab', { name: /RETENTION/ } ) );

		expect( screen.queryByTestId( 'line-chart' ) ).not.toBeInTheDocument();
		expect( screen.getByText( /Retention has no time series/ ) ).toBeInTheDocument();

		// Selecting a series-backed metric brings the chart back.
		await user.click( screen.getByRole( 'tab', { name: /IMPRESSIONS/ } ) );
		expect( screen.getByTestId( 'line-chart' ) ).toBeInTheDocument();
	} );
} );
