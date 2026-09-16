/* No jest-dom in this project. */
/* eslint-disable testing-library/no-node-access */
import { render, screen, within } from '@testing-library/react';
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
	let card: HTMLElement | null = screen.getByRole( 'heading', { level: 2, name: heading } );
	while ( card && ! card.querySelector( '[data-testid="stub"]' ) ) {
		card = card.parentElement;
	}
	return within( card as HTMLElement )
		.getAllByTestId( 'stub' )
		.map( s => s.textContent );
};

describe( 'Settings', () => {
	it( 'groups the modules into the designed cards, Cornerstone pages last', () => {
		render( <Settings /> );

		expect( screen.getAllByRole( 'heading', { level: 2 } ).map( h => h.textContent ) ).toEqual( [
			'Code loading optimization',
			'Image loading optimization',
			'Image CDN configuration',
			'Image guide',
		] );
		expect( screen.getAllByTestId( 'stub' ).at( -1 )?.textContent ).toBe( 'cornerstone' );
		expect( modulesIn( 'Code loading optimization' ) ).toEqual( [
			'critical_css',
			'cloud_css',
			'page_cache',
			'render_blocking_js',
			'minify_js',
			'minify_css',
		] );
		expect( modulesIn( 'Image loading optimization' ) ).toEqual( [ 'lcp' ] );
		expect( modulesIn( 'Image CDN configuration' ) ).toEqual( [ 'image_cdn' ] );
		expect( modulesIn( 'Image guide' ) ).toEqual( [ 'image_guide:row' ] );
	} );
} );
