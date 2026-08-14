import { render, screen } from '@testing-library/react';
import { useFreeTier } from '../../../src/dashboard/hooks/use-free-tier';
import { stage as Stage } from '../stage';
import type { FreeTierState } from '../../../src/dashboard/hooks/use-free-tier';
import type { QueryClient } from '@tanstack/react-query';
import type { ReactNode } from 'react';

// Declared here (and not only inside test-utils/mock-api-fetch) because this
// file imports hook modules BEFORE the test-utils helper: jest.mock calls
// in this file are hoisted above all imports, so the hook modules resolve the
// mocked module instead of capturing the real one first.
jest.mock( '@wordpress/api-fetch', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: jest.fn( () => jest.fn() ),
	// DashboardLayout mounts the onboarding modal, which reads the route's
	// search params for its `welcome=1` review affordance.
	useSearch: jest.fn( () => ( {} ) ),
} ) );

// The AdminPage chrome needs the full admin shell; reduce it to the slots the
// tests interact with (actions, body).
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { actions, children }: { actions?: ReactNode; children?: ReactNode } ) => (
		<div>
			<div>{ actions }</div>
			{ children }
		</div>
	),
} ) );

const mockErrorNotice = jest.fn();
jest.mock( '@automattic/jetpack-components/global-notices', () => ( {
	useGlobalNotices: () => ( {
		createErrorNotice: mockErrorNotice,
	} ),
} ) );

// The stage's own QueryClientWrapper carries the window-singleton client and
// the connection gate; swap in a per-test client so cache state can't leak
// between tests and the gate's fetches stay out of the way.
let mockTestClient: QueryClient;
jest.mock( '../../../src/dashboard/components/query-client-wrapper', () => {
	const { QueryClientProvider } = jest.requireActual( '@tanstack/react-query' );
	return {
		__esModule: true,
		default: ( { children }: { children: ReactNode } ) => (
			<QueryClientProvider client={ mockTestClient }>{ children }</QueryClientProvider>
		),
	};
} );

// The settings form's data layer is covered by use-settings.test.ts; here it
// only needs to render, so pin it to a settled, server-uncontrolled state.
jest.mock( '../../../src/dashboard/hooks/use-settings', () => ( {
	isPrivateForSiteServerControlled: () => false,
	useSettings: () => ( {
		data: { videoPressVideosPrivateForSite: false, videoPressAutoSubtitlesDisabled: false },
		isLoading: false,
	} ),
	useUpdateSettings: () => ( { mutate: jest.fn(), isPending: false } ),
} ) );

// Free-tier state is what the tests steer; the notice's checkout wiring is
// covered by the FreeTierNotice component tests.
jest.mock( '../../../src/dashboard/hooks/use-free-tier', () => ( {
	useFreeTier: jest.fn(),
} ) );
jest.mock( '../../../src/dashboard/hooks/use-videopress-upgrade', () => ( {
	useVideoPressUpgrade: () => jest.fn(),
} ) );

const mockedUseFreeTier = useFreeTier as jest.Mock;

const freeTierState = ( overrides: Partial< FreeTierState > = {} ): FreeTierState => ( {
	isFree: true,
	isAtomic: false,
	isUnlimited: false,
	videoCount: 0,
	limit: 1,
	isAtLimit: false,
	...overrides,
} );

describe( 'Settings stage', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		const { QueryClient } = jest.requireActual( '@tanstack/react-query' );
		mockTestClient = new QueryClient( {
			defaultOptions: { queries: { retry: false } },
		} );
	} );

	it( 'shows the upgrade notice once the free upload is used', () => {
		mockedUseFreeTier.mockReturnValue( freeTierState( { videoCount: 1, isAtLimit: true } ) );

		render( <Stage /> );

		// Every surface shows the same sentence — the notice used to switch to
		// a shorter at-limit line here, so the same banner read differently
		// depending on which tab you were standing on.
		expect(
			screen.getByText(
				'You’re on the free plan, which allows 1 video upload. Upgrade for more storage and unlimited uploads.'
			)
		).toBeInTheDocument();
		expect( screen.getByRole( 'link', { name: 'Upgrade' } ) ).toBeInTheDocument();
	} );

	it( 'shows no upgrade notice while the free upload is still available', () => {
		mockedUseFreeTier.mockReturnValue( freeTierState() );

		render( <Stage /> );

		expect(
			screen.queryByText( 'You’ve reached the free plan’s 1-video limit. Upgrade to upload more.' )
		).not.toBeInTheDocument();
		expect( screen.queryByRole( 'link', { name: 'Upgrade' } ) ).not.toBeInTheDocument();
	} );
} );
