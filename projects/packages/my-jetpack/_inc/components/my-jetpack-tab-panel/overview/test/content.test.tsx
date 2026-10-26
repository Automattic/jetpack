import '@testing-library/jest-dom';
import { fireEvent, render, screen } from '@testing-library/react';
import { OverviewContent } from '../content';

jest.mock( '../../../../data/use-site-purchases', () => jest.fn() );
jest.mock( '../../../../data/utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( { overviewV1: true } ),
} ) );
jest.mock( '../../../header-controls/slot', () => ( { isHeaderControlsEnabled: () => false } ) );
jest.mock( '../../../overview-blog-posts', () => () => null );
jest.mock( '../../../product-cards-section', () => () => null );
jest.mock( '../../../product-cards-section/overview-sections', () => () => null );
jest.mock( '../../../seo-opt-in-card', () => () => null );
jest.mock( '../a4a-upsell', () => ( { A4AUpsell: () => null } ) );

describe( 'OverviewContent', () => {
	it.each( [
		[ 'Admin', 'Welcome to Jetpack, Admin!' ],
		[ 'Tom &amp; Jerry', 'Welcome to Jetpack, Tom & Jerry!' ],
		[ '', 'Welcome to Jetpack' ],
	] )( 'with the display name "%s", reads "%s"', ( displayName, heading ) => {
		window.JetpackScriptData = {
			user: { current_user: { display_name: displayName, capabilities: {} } },
		} as typeof window.JetpackScriptData;
		render( <OverviewContent /> );

		expect( screen.getByRole( 'heading', { level: 2, name: heading } ) ).toBeInTheDocument();
	} );

	describe( 'load animation', () => {
		const heading = 'Welcome to Jetpack, Admin!';
		let Content: typeof OverviewContent;
		const setReducedMotion = ( matches: boolean ) =>
			Object.defineProperty( window, 'matchMedia', {
				configurable: true,
				value: () => ( { matches } ),
			} );

		beforeEach( async () => {
			window.JetpackScriptData = {
				user: { current_user: { display_name: 'Admin', capabilities: {} } },
			} as typeof window.JetpackScriptData;
			setReducedMotion( false );
			// A fresh module registry resets the once-per-page-load flag; React must stay shared.
			const react = jest.requireActual( 'react' );
			await jest.isolateModulesAsync( async () => {
				jest.doMock( 'react', () => react );
				( { OverviewContent: Content } = await import( '../content' ) );
			} );
		} );

		const typedText = () =>
			screen.queryByText( ( _, element ) => element?.textContent === heading, {
				selector: 'h2 [aria-hidden="true"]',
			} );

		it( 'types the heading for sighted users only, giving assistive tech the whole of it', () => {
			render( <Content /> );

			expect( screen.getByRole( 'heading', { level: 2, name: heading } ) ).toBeInTheDocument();
			expect( typedText() ).toBeInTheDocument();
		} );

		it( 'shows the heading at once with reduced motion', () => {
			setReducedMotion( true );
			render( <Content /> );

			expect( typedText() ).not.toBeInTheDocument();
			expect( screen.getByRole( 'heading', { level: 2, name: heading } ) ).toBeInTheDocument();
		} );

		it.each( [
			[ 'does not replay on returning to the tab', true, false ],
			[ 'still plays when the Overview remounts before it has played', false, true ],
		] )( '%s', ( _, played, animates ) => {
			const { unmount } = render( <Content /> );
			if ( played ) {
				// jsdom has no AnimationEvent, so React listens for the prefixed name.
				fireEvent( screen.getByText( '!' ), new Event( 'webkitAnimationEnd', { bubbles: true } ) );
			}
			unmount();
			render( <Content /> );

			expect( Boolean( typedText() ) ).toBe( animates );
		} );
	} );
} );
