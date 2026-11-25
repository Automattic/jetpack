import { act, render, screen } from '@testing-library/react';
import { resetPromoDismissalForTesting } from '../../../../packages/widgets-toolkit/src/hooks/use-promo-slot';
import { StatsSettingsPanel } from './stats-settings';

const mockUsePlanUsage = jest.fn();
jest.mock( '@jetpack-premium-analytics/data', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/data' ),
	useStatsAppPlanUsage: () => mockUsePlanUsage(),
} ) );

jest.mock( '@jetpack-premium-analytics/widgets-toolkit', () => ( {
	...jest.requireActual( '@jetpack-premium-analytics/widgets-toolkit' ),
	PromoCard: ( { promo }: { promo: { slug: string } } ) => (
		<div data-testid="promo-card">{ promo.slug }</div>
	),
} ) );

jest.mock( '../consent-card', () => ( { ConsentCard: () => null } ) );
jest.mock( '../plan-usage-card', () => ( { PlanUsageCard: () => null } ) );
jest.mock( '../settings-form', () => ( {
	SettingsForm: () => <div data-testid="settings-form" />,
} ) );

const setScriptData = (
	featuresUrl: string | null,
	featuresScreen: 'features' | 'modules' | null = null,
	promos: Array< Record< string, unknown > > = []
) => {
	window.JetpackScriptData = {
		premium_analytics: {
			promos,
			stats_settings: {
				roles: [],
				features_url: featuresUrl,
				features_screen: featuresScreen,
			},
		},
	} as typeof window.JetpackScriptData;
};

const settingsPromo = {
	slug: 'upgrade',
	placement: 'settings',
	target: null,
	order: 0,
	title: 'Upgrade',
	description: '',
	cta_label: 'Go',
	cta_url: 'https://example.com',
	cta_variant: 'primary',
	dismissible: true,
	snooze_days: 7,
};

describe( 'StatsSettingsPanel', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		resetPromoDismissalForTesting();
		mockUsePlanUsage.mockReturnValue( { isLoading: false } );
		setScriptData( null );
	} );

	afterEach( () => {
		delete window.JetpackScriptData;
	} );

	it( 'leaves out the Activation card when there is no Jetpack features screen to link to', () => {
		render( <StatsSettingsPanel /> );

		expect( screen.queryByText( 'Activation' ) ).not.toBeInTheDocument();
	} );

	it.each( [
		[ 'features', 'Jetpack features', 'admin.php?page=my-jetpack#/features?search=stats' ],
		[ 'modules', 'Jetpack modules', 'admin.php?page=jetpack_modules&s=stats' ],
	] as const )(
		'names the %s screen the Activation card links to',
		( featuresScreen, name, url ) => {
			setScriptData( url, featuresScreen );

			render( <StatsSettingsPanel /> );

			expect( screen.getByRole( 'link', { name } ) ).toHaveAttribute( 'href', url );
		}
	);

	it( 'renders the settings promo after the Activation card', () => {
		setScriptData( 'admin.php?page=my-jetpack#/features', 'features', [ settingsPromo ] );

		render( <StatsSettingsPanel /> );

		const activation = screen.getByText( 'Activation' );
		const promoCard = screen.getByTestId( 'promo-card' );
		expect( promoCard ).toHaveTextContent( 'upgrade' );
		expect( activation.compareDocumentPosition( promoCard ) ).toBe(
			Node.DOCUMENT_POSITION_FOLLOWING
		);
	} );

	it( 'renders no settings promo when none is registered for the placement', () => {
		setScriptData( null, null, [ { ...settingsPromo, placement: 'options-menu' } ] );

		render( <StatsSettingsPanel /> );

		expect( screen.queryByTestId( 'promo-card' ) ).not.toBeInTheDocument();
	} );

	it( 'draws no card while the plan usage loads, so the page does not shift when it arrives', () => {
		mockUsePlanUsage.mockReturnValue( { isLoading: true } );

		render( <StatsSettingsPanel /> );

		expect( screen.getByRole( 'status' ) ).toHaveTextContent( 'Loading your Stats settings…' );
		expect( screen.queryByTestId( 'settings-form' ) ).not.toBeInTheDocument();
	} );

	it( 'draws the cards once the first plan usage attempt fails, leaving the retries to the card', () => {
		mockUsePlanUsage.mockReturnValue( { isLoading: true, failureCount: 1 } );

		render( <StatsSettingsPanel /> );

		expect( screen.getByTestId( 'settings-form' ) ).toBeInTheDocument();
	} );

	it( 'draws the cards when the plan usage is still loading after two seconds', () => {
		jest.useFakeTimers();
		mockUsePlanUsage.mockReturnValue( { isLoading: true, failureCount: 0 } );
		render( <StatsSettingsPanel /> );

		act( () => jest.advanceTimersByTime( 2000 ) );

		expect( screen.getByTestId( 'settings-form' ) ).toBeInTheDocument();
		jest.useRealTimers();
	} );

	it( 'keeps the cards once the plan usage has answered, while the card retries a failed usage', () => {
		mockUsePlanUsage.mockReturnValue( { isLoading: true } );
		const { rerender } = render( <StatsSettingsPanel /> );
		mockUsePlanUsage.mockReturnValue( { isLoading: false } );
		rerender( <StatsSettingsPanel /> );

		mockUsePlanUsage.mockReturnValue( { isLoading: true } );
		rerender( <StatsSettingsPanel /> );

		expect( screen.getByTestId( 'settings-form' ) ).toBeInTheDocument();
	} );
} );
