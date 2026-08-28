import { render, screen } from '@testing-library/react';
import { clearMockedScriptData, mockScriptData } from '../../../utils/test-utils';
import TrafficChartCard from '../traffic-chart-card';

// This suite is about which upgrade destination the locked state offers, not the
// chart. Stubbing it also keeps @automattic/charts and its CSS import out of the run.
jest.mock( '@automattic/charts', () => ( {
	LineChart: () => <div data-testid="line-chart" />,
} ) );

jest.mock( '../../../social-store', () => ( { store: 'jetpack-social' } ) );

const mockUseSelect = jest.fn();

// Override the two hooks the card uses and forward the rest. A Proxy rather than a
// spread of `requireActual`, which evaluates every getter up front and trips a
// circular import inside @wordpress/data.
jest.mock( '@wordpress/data', () => {
	const actual = jest.requireActual( '@wordpress/data' );
	const overrides: Record< string, unknown > = {
		useSelect: ( ...args: unknown[] ) => mockUseSelect( ...args ),
		useDispatch: () => ( { setTrafficInterval: jest.fn() } ),
	};
	return new Proxy( actual, {
		get: ( target, prop: string ) =>
			prop in overrides ? overrides[ prop ] : Reflect.get( target, prop ),
	} );
} );

/**
 * Stub the store reads the card makes. Referrer data is left unresolved: the locked
 * state draws its own mock curve, and the paid state only has to render.
 */
function stubStore() {
	mockUseSelect.mockImplementation( ( mapSelect: ( select: unknown ) => unknown ) =>
		mapSelect( () => ( {
			getTrafficInterval: () => 7,
			getTrafficReferrers: () => undefined,
			isTrafficReferrersLoading: () => false,
			getTrafficReferrersError: () => null,
			getConnections: () => [],
		} ) )
	);
}

/**
 * A WordPress.com Simple site without Social's paid features.
 *
 * @return The installed script data.
 */
const setupSimpleSite = () =>
	mockScriptData( {
		site: { host: 'wpcom', suffix: 'example.wordpress.com', plan: { features: { active: [] } } },
		social: { upgrade: { plan_slug: 'business-bundle', plan_name: 'Business' } },
	} );

/**
 * A self-hosted Jetpack site without Social's paid features.
 *
 * @return The installed script data.
 */
const setupSelfHostedSite = () =>
	mockScriptData( {
		site: { host: 'unknown', suffix: 'example.com', plan: { features: { active: [] } } },
	} );

beforeEach( stubStore );

afterEach( () => {
	clearMockedScriptData();
	jest.clearAllMocks();
} );

describe( 'TrafficChartCard upgrade prompt', () => {
	it( 'sends a Simple site to the WordPress.com plans page', () => {
		setupSimpleSite();

		render( <TrafficChartCard /> );

		const url = new URL(
			screen.getByRole( 'link', { name: 'Upgrade now' } ).getAttribute( 'href' )
		);

		expect( url.origin + url.pathname ).toBe( 'https://wordpress.com/plans/example.wordpress.com' );
		expect( url.searchParams.get( 'plan' ) ).toBe( 'business-bundle' );
	} );

	it( 'names the required plan in the prompt on a Simple site', () => {
		setupSimpleSite();

		render( <TrafficChartCard /> );

		expect(
			screen.getByText(
				'Upgrade to the Business plan to see which social networks are driving visits to your site, day by day.'
			)
		).toBeInTheDocument();
	} );

	it( 'keeps the Jetpack redirect service for self-hosted sites', () => {
		setupSelfHostedSite();

		render( <TrafficChartCard /> );

		expect( screen.getByRole( 'link', { name: 'Upgrade now' } ) ).toHaveAttribute(
			'href',
			expect.stringContaining( 'source=jetpack-social-v1-plan-plugin-admin-page' )
		);
	} );

	it( 'keeps the plan-agnostic prompt on self-hosted sites', () => {
		setupSelfHostedSite();

		render( <TrafficChartCard /> );

		expect(
			screen.getByText(
				'Upgrade to see which social networks are driving visits to your site, day by day.'
			)
		).toBeInTheDocument();
	} );

	it( 'shows no upgrade prompt once the site has the paid features', () => {
		mockScriptData( {
			site: {
				host: 'wpcom',
				suffix: 'example.wordpress.com',
				plan: { features: { active: [ 'social-enhanced-publishing' ] } },
			},
		} );

		render( <TrafficChartCard /> );

		expect( screen.queryByRole( 'link', { name: 'Upgrade now' } ) ).not.toBeInTheDocument();
	} );
} );
