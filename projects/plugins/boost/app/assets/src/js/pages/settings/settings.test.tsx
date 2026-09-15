import { render, screen } from '@testing-library/react';
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
jest.mock( '$features/image-guide/image-guide', () => {
	const { useModuleSurface } = jest.requireActual( '$features/module/surface' );
	return () => <div data-testid="stub">image_guide:{ useModuleSurface() }</div>;
} );

describe( 'Settings', () => {
	it( 'groups the modules into four cards in the legacy order', () => {
		render( <Settings /> );

		expect( screen.getAllByRole( 'heading', { level: 2 } ).map( h => h.textContent ) ).toEqual( [
			'Code loading optimization',
			'Image CDN configuration',
			'Image guide',
		] );
		expect( screen.getAllByTestId( 'stub' ).map( s => s.textContent ) ).toEqual( [
			'cornerstone',
			'critical_css',
			'cloud_css',
			'page_cache',
			'render_blocking_js',
			'minify_js',
			'minify_css',
			'image_cdn',
			'image_guide:row',
		] );
	} );
} );
