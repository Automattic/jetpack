/* No jest-dom or user-event in this project, and the hidden and tooltip assertions need the nodes themselves. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-text-content, testing-library/prefer-user-event, testing-library/no-container, testing-library/no-node-access */
import { fireEvent, render, screen } from '@testing-library/react';
import ModernSettings from './modern-settings';

jest.mock( '$lib/stores/premium-features', () => ( {
	usePremiumFeatures: () => [],
} ) );
jest.mock( '../../pages/settings/settings', () => {
	const { ModuleSurfaceProvider } = jest.requireActual( '$features/module/surface' );
	const PremiumTooltip = jest.requireActual( '$features/premium-tooltip/premium-tooltip' ).default;
	return {
		__esModule: true,
		default: ( { active = true }: { active?: boolean } ) => (
			<ModuleSurfaceProvider value="row">
				<div data-testid="settings-active">{ String( active ) }</div>
				<div>settings body</div>
				<div data-testid="card">
					<PremiumTooltip />
				</div>
			</ModuleSurfaceProvider>
		),
	};
} );
jest.mock( '$features/upgrade-cta/interstitial-modal-cta', () => () => null );
jest.mock( '$features/notice/manager', () => ( {
	__esModule: true,
	default: ( { modern }: { modern?: boolean } ) => (
		<div>{ modern ? 'modern notices' : 'legacy notices' }</div>
	),
} ) );

describe( 'ModernSettings', () => {
	it( 'renders the settings body without the chassis-owned header or speed scores', () => {
		const { container } = render( <ModernSettings /> );

		expect( screen.getByText( 'settings body' ) ).toBeTruthy();
		expect( screen.getByText( 'modern notices' ) ).toBeTruthy();
		expect( container.querySelector( '.jb-dashboard' ) ).toBeNull();
	} );

	it( 'hides itself without unmounting while a redirect is pending', () => {
		const { container } = render( <ModernSettings hidden /> );

		expect( screen.getByText( 'settings body' ) ).toBeTruthy();
		expect( container.querySelector( '[hidden]' ) ).not.toBeNull();
	} );

	it( 'enables exposure only for an active dashboard without a hidden redirect', () => {
		const view = render( <ModernSettings hidden /> );
		expect( screen.getByTestId( 'settings-active' ).textContent ).toBe( 'false' );
		view.rerender( <ModernSettings active={ false } /> );
		expect( screen.getByTestId( 'settings-active' ).textContent ).toBe( 'false' );
		view.rerender( <ModernSettings /> );
		expect( screen.getByTestId( 'settings-active' ).textContent ).toBe( 'true' );
	} );

	it( 'opens card tooltips outside the card, which clips its overflow', () => {
		const { container } = render( <ModernSettings /> );
		const card = screen.getByTestId( 'card' );

		fireEvent.click( card.querySelector( 'button' ) as HTMLElement );

		const title = screen.getByText( 'Manual Critical CSS regeneration' );
		expect( card.contains( title ) ).toBe( false );
		expect( container.querySelector( '.jb-modern-settings-popovers' )?.contains( title ) ).toBe(
			true
		);
	} );
} );
