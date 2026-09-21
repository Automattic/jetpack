/* No jest-dom in this project. */
/* eslint-disable testing-library/no-node-access, testing-library/prefer-user-event, jest-dom/prefer-to-have-attribute */
import { fireEvent, render, screen, within } from '@testing-library/react';
import Settings from './settings';

/* Each module stub prints its name so the test can assert the order. */
jest.mock( '$features/cornerstone-pages/cornerstone-pages-card', () => () => (
	<div data-testid="stub">cornerstone</div>
) );
jest.mock( '$features/critical-css/critical-css-module/critical-css-module', () => () => (
	<div data-testid="stub">critical_css</div>
) );
jest.mock( '$features/critical-css/cloud-css-module/cloud-css-module', () => () => (
	<div data-testid="stub">cloud_css</div>
) );
jest.mock( '$features/page-cache/page-cache', () => () => (
	<div data-testid="stub">page_cache</div>
) );
jest.mock( '$features/render-blocking-js/render-blocking-js', () => () => (
	<div data-testid="stub">render_blocking_js</div>
) );
jest.mock( '$features/minify-js/minify-js', () => () => <div data-testid="stub">minify_js</div> );
jest.mock( '$features/minify-css/minify-css', () => () => (
	<div data-testid="stub">minify_css</div>
) );
jest.mock( '$features/image-cdn/image-cdn', () => () => <div data-testid="stub">image_cdn</div> );
jest.mock( '$features/lcp/lcp', () => () => <div data-testid="stub">lcp</div> );
jest.mock( '$features/image-guide/image-guide', () => {
	const { useModuleSurface } = jest.requireActual( '$features/module/surface' );
	return () => <div data-testid="stub">image_guide:{ useModuleSurface() }</div>;
} );

/**
 * @param heading - The card's title.
 * @return The stubs rendered inside that card, in order.
 */
const modulesIn = ( heading: string ) => {
	let card: HTMLElement | null = screen.getByRole( 'button', { name: heading } );
	while ( card && ! card.querySelector( '[data-testid="stub"]' ) ) {
		card = card.parentElement;
	}
	return within( card as HTMLElement )
		.getAllByTestId( 'stub' )
		.map( s => s.textContent );
};

describe( 'Settings', () => {
	it( 'renders the designed cards in order, each holding its modules', () => {
		render( <Settings /> );

		expect( screen.getAllByRole( 'button' ).map( button => button.textContent ) ).toEqual( [
			'Cornerstone pagesAdd your most important pages for targeted optimizations, including Critical CSS.',
			'Page loadingManage how your page content is loaded for visitors.',
			'Code optimizationReduce the code needed to load your site.',
			'ImagesTools to load and deliver images more efficiently.',
		] );
		expect( modulesIn( 'Page loading' ) ).toEqual( [
			'critical_css',
			'cloud_css',
			'page_cache',
			'render_blocking_js',
		] );
		expect( modulesIn( 'Code optimization' ) ).toEqual( [ 'minify_js', 'minify_css' ] );
		expect( modulesIn( 'Images' ) ).toEqual( [ 'lcp', 'image_cdn', 'image_guide:row' ] );
		fireEvent.click( screen.getByRole( 'button', { name: 'Cornerstone pages' } ) );
		expect( modulesIn( 'Cornerstone pages' ) ).toEqual( [ 'cornerstone' ] );
	} );

	it( 'starts with only Cornerstone collapsed and lets each section toggle independently', () => {
		render( <Settings /> );

		const buttons = screen.getAllByRole( 'button' );
		expect( buttons.map( button => button.getAttribute( 'aria-expanded' ) ) ).toEqual( [
			'false',
			'true',
			'true',
			'true',
		] );
		for ( const button of buttons ) {
			const wasOpen = button.getAttribute( 'aria-expanded' );
			fireEvent.click( button );
			expect( button.getAttribute( 'aria-expanded' ) ).toBe(
				wasOpen === 'true' ? 'false' : 'true'
			);
			fireEvent.click( button );
			expect( button.getAttribute( 'aria-expanded' ) ).toBe( wasOpen );
		}
	} );
} );
