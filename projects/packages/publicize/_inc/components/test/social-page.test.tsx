import { currentUserCan } from '@automattic/jetpack-script-data';
import { render, screen } from '@testing-library/react';
import { Tabs } from '@wordpress/ui';
import SocialPage from '../social-page';

// AdminPage pulls in the full jetpack-components chrome (and its build
// artifact); stub it down to a passthrough so this test isolates the tab nav.
jest.mock( '@automattic/jetpack-components/admin-page', () => ( {
	__esModule: true,
	default: ( { children, actions }: { children: React.ReactNode; actions?: React.ReactNode } ) => (
		<div>
			{ actions }
			{ children }
		</div>
	),
} ) );

jest.mock( '@automattic/jetpack-script-data', () => ( {
	getSiteData: () => ( {} ),
	currentUserCan: jest.fn(),
} ) );

jest.mock( '@wordpress/route', () => ( {
	useNavigate: () => jest.fn(),
} ) );

// The gate decision is exercised elsewhere; force the happy path (no gate)
// so SocialGate just renders the tab block.
jest.mock( '../social-gate', () => ( {
	__esModule: true,
	default: ( { children }: { children: React.ReactNode } ) => <>{ children }</>,
} ) );
jest.mock( '../social-gate/use-social-gate', () => ( {
	__esModule: true,
	default: () => ( { gate: null, dismissPricing: jest.fn() } ),
} ) );

const mockCurrentUserCan = currentUserCan as jest.Mock;

afterEach( () => {
	jest.clearAllMocks();
} );

describe( 'SocialPage', () => {
	it( 'renders the Overview and Settings tabs for admins', () => {
		mockCurrentUserCan.mockReturnValue( true );

		render(
			<SocialPage activeTab="overview">
				<Tabs.Panel value="overview">
					<div data-testid="overview-content" />
				</Tabs.Panel>
				<Tabs.Panel value="settings">
					<div data-testid="settings-content" />
				</Tabs.Panel>
			</SocialPage>
		);

		const tabs = screen.getAllByRole( 'tab' );
		expect( tabs ).toHaveLength( 2 );
		expect( screen.getByRole( 'tab', { name: 'Overview' } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'tab', { name: 'Settings' } ) ).toBeInTheDocument();
	} );

	it( 'renders no tab chrome for non-admins, only the content', () => {
		mockCurrentUserCan.mockReturnValue( false );

		render(
			<SocialPage activeTab="overview">
				<div data-testid="overview-content" />
			</SocialPage>
		);

		expect( screen.queryAllByRole( 'tab' ) ).toHaveLength( 0 );
		expect( screen.queryByRole( 'tab', { name: 'Settings' } ) ).not.toBeInTheDocument();
		expect( screen.getByTestId( 'overview-content' ) ).toBeInTheDocument();
	} );
} );
