/* No jest-dom or user-event in this project, and the hidden and tooltip assertions need the nodes themselves. */
/* eslint-disable jest-dom/prefer-in-document, testing-library/prefer-user-event, testing-library/no-container, testing-library/no-node-access */
import { fireEvent, render, screen } from '@testing-library/react';
import ModernSettings from './modern-settings';

jest.mock( '$lib/stores/premium-features', () => ( {
	usePremiumFeatures: () => mockPremiumFeatures,
} ) );
jest.mock( '../../pages/settings/settings', () => {
	const { ModuleSurfaceProvider } = jest.requireActual( '$features/module/surface' );
	const PremiumTooltip = jest.requireActual( '$features/premium-tooltip/premium-tooltip' ).default;
	return {
		__esModule: true,
		default: () => (
			<ModuleSurfaceProvider value="row">
				<div>settings body</div>
				<div data-testid="card">
					<PremiumTooltip />
				</div>
			</ModuleSurfaceProvider>
		),
	};
} );
jest.mock( '$features/upgrade-cta/interstitial-modal-cta', () => () => null );
jest.mock( '$layout/settings-page/tips/tips', () => ( {
	__esModule: true,
	default: () => <div>tips</div>,
} ) );
jest.mock( '$layout/settings-page/support/support', () => ( {
	__esModule: true,
	default: () => <div>priority support</div>,
} ) );
jest.mock( '$features/notice/manager', () => ( {
	__esModule: true,
	default: () => <div>notices</div>,
} ) );

let mockPremiumFeatures: string[] = [];

describe( 'ModernSettings', () => {
	beforeEach( () => {
		mockPremiumFeatures = [];
	} );

	it( 'renders the settings body without the chassis-owned header or speed scores', () => {
		const { container } = render( <ModernSettings /> );

		expect( screen.getByText( 'settings body' ) ).toBeTruthy();
		expect( container.querySelector( '.jb-dashboard' ) ).toBeNull();
	} );

	it( 'shows priority support only on a plan that includes it', () => {
		const view = render( <ModernSettings /> );
		expect( screen.queryByText( 'priority support' ) ).toBeNull();
		view.unmount();

		mockPremiumFeatures = [ 'support' ];
		render( <ModernSettings /> );

		expect( screen.getByText( 'priority support' ) ).toBeTruthy();
	} );

	it( 'hides itself without unmounting while a redirect is pending', () => {
		const { container } = render( <ModernSettings hidden /> );

		expect( screen.getByText( 'settings body' ) ).toBeTruthy();
		expect( container.querySelector( '[hidden]' ) ).not.toBeNull();
	} );

	it( 'opens card tooltips outside the card, which clips its overflow', () => {
		render( <ModernSettings /> );
		const card = screen.getByTestId( 'card' );

		fireEvent.mouseDown( card.querySelector( 'button' ) as HTMLElement );

		const title = screen.getByText( 'Manual Critical CSS regeneration' );
		expect( card.contains( title ) ).toBe( false );
	} );
} );
