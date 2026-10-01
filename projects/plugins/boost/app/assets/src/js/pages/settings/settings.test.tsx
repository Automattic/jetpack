/* No jest-dom in this project. */
/* eslint-disable testing-library/no-node-access, testing-library/prefer-user-event, jest-dom/prefer-to-have-attribute, jest-dom/prefer-in-document */
import { act, fireEvent, render, screen, within } from '@testing-library/react';
import { StrictMode } from 'react';
import { recordBoostEvent } from '$lib/utils/analytics';
import Settings from './settings';

/* Each module stub prints its name so the test can assert the order. */
jest.mock( '$features/cornerstone-pages/cornerstone-pages', () => ( {
	useCornerstoneSummary: () => 'Added: Homepage',
} ) );
jest.mock( '$features/cornerstone-pages/meta/meta', () => ( {
	CornerstonePagesDescription: () => <>cornerstone description</>,
	CornerstonePagesEditor: () => <div>editor</div>,
	CornerstonePagesUpgradeCTA: () => <div>upgrade</div>,
} ) );
jest.mock( '$features/cornerstone-pages/prerender/prerender', () => () => (
	<div data-testid="stub">prerender</div>
) );
jest.mock( '$features/module/lib/stores', () => ( {
	useSingleModuleState: () => [ { available: true } ],
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );
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
			'Cornerstone PagesAdded: HomepageChoose the pages that matter most on your site so Boost can give them its most targeted optimizations.',
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
		fireEvent.click( screen.getByRole( 'button', { name: 'Cornerstone Pages' } ) );
		expect( modulesIn( 'Cornerstone Pages' ) ).toEqual( [ 'prerender' ] );
		expect( screen.getAllByRole( 'heading', { name: 'Cornerstone Pages' } ) ).toHaveLength( 1 );
		expect( screen.getAllByText( 'cornerstone description' ) ).toHaveLength( 1 );
		expect( screen.getAllByText( 'Added: Homepage' ) ).toHaveLength( 1 );
	} );

	it( 'shows the Cornerstone description in the header while collapsed', () => {
		render( <Settings /> );

		const button = screen.getByRole( 'button', {
			name: 'Cornerstone Pages',
			description: /Choose the pages that matter most on your site/,
		} );
		expect( button.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
	} );

	it( 'renders the section titles as h3s beneath the page h2', () => {
		render( <Settings /> );

		expect(
			screen.getAllByRole( 'heading', { level: 3 } ).map( heading => heading.textContent )
		).toEqual( [
			'Cornerstone PagesAdded: HomepageChoose the pages that matter most on your site so Boost can give them its most targeted optimizations.',
			'Page loadingManage how your page content is loaded for visitors.',
			'Code optimizationReduce the code needed to load your site.',
			'ImagesTools to load and deliver images more efficiently.',
		] );
		expect( screen.queryByRole( 'heading', { level: 2 } ) ).toBeNull();
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

const observers: {
	callback: IntersectionObserverCallback;
	target?: Element;
	connected: boolean;
}[] = [];
const originalObserver = globalThis.IntersectionObserver;

const exposeHeaders = ( ratio = 1 ) => {
	act( () => {
		for ( const observer of observers ) {
			if ( observer.connected && observer.target ) {
				observer.callback(
					[
						{
							target: observer.target,
							isIntersecting: true,
							intersectionRatio: ratio,
						} as IntersectionObserverEntry,
					],
					{} as IntersectionObserver
				);
			}
		}
	} );
};

describe( 'Settings exposure and group interactions', () => {
	beforeEach( () => {
		jest.mocked( recordBoostEvent ).mockClear();
		observers.length = 0;
		globalThis.IntersectionObserver = jest.fn( callback => {
			const state = { callback, connected: true, target: undefined as Element | undefined };
			observers.push( state );
			return {
				observe: ( target: Element ) => {
					state.target = target;
				},
				disconnect: () => {
					state.connected = false;
				},
			};
		} ) as unknown as typeof IntersectionObserver;
	} );

	afterEach( () => {
		globalThis.IntersectionObserver = originalObserver;
	} );

	it( 'records visible Settings and each header once per visit, including default-open groups', () => {
		const view = render(
			<StrictMode>
				<Settings />
			</StrictMode>
		);
		expect( recordBoostEvent ).not.toHaveBeenCalled();
		exposeHeaders();
		exposeHeaders();
		expect( recordBoostEvent ).toHaveBeenCalledTimes( 5 );
		expect( recordBoostEvent ).toHaveBeenCalledWith( 'settings_view', {} );
		for ( const [ group, initial_open ] of [
			[ 'cornerstone_pages', 0 ],
			[ 'page_loading', 1 ],
			[ 'code_optimization', 1 ],
			[ 'images', 1 ],
		] ) {
			expect( recordBoostEvent ).toHaveBeenCalledWith( 'settings_group_view', {
				group,
				initial_open,
			} );
		}

		fireEvent.click( screen.getByRole( 'button', { name: 'Page loading' } ) );
		view.rerender(
			<StrictMode>
				<Settings active={ false } />
			</StrictMode>
		);
		exposeHeaders();
		expect( recordBoostEvent ).toHaveBeenCalledTimes( 6 );
		view.rerender(
			<StrictMode>
				<Settings />
			</StrictMode>
		);
		exposeHeaders();
		expect( recordBoostEvent ).toHaveBeenCalledTimes( 11 );
		expect( jest.mocked( recordBoostEvent ).mock.calls.slice( 6 ) ).toEqual(
			expect.arrayContaining( [
				[ 'settings_view', {} ],
				[ 'settings_group_view', { group: 'cornerstone_pages', initial_open: 0 } ],
				[ 'settings_group_view', { group: 'page_loading', initial_open: 0 } ],
				[ 'settings_group_view', { group: 'code_optimization', initial_open: 1 } ],
				[ 'settings_group_view', { group: 'images', initial_open: 1 } ],
			] )
		);
	} );

	it( 'ignores hidden redirects and headers outside the viewport', () => {
		const view = render(
			<div hidden>
				<Settings active={ false } />
			</div>
		);
		exposeHeaders();
		expect( recordBoostEvent ).not.toHaveBeenCalled();
		view.rerender(
			<div>
				<Settings />
			</div>
		);
		act( () => {
			for ( const observer of observers.filter( item => item.connected ) ) {
				observer.callback(
					[ { isIntersecting: false, intersectionRatio: 0 } as IntersectionObserverEntry ],
					{} as IntersectionObserver
				);
			}
		} );
		expect( recordBoostEvent ).not.toHaveBeenCalled();
		exposeHeaders();
		expect( recordBoostEvent ).toHaveBeenCalledTimes( 5 );
	} );

	it( 'waits for the whole header before recording group exposure', () => {
		render( <Settings /> );
		exposeHeaders( 0.99 );
		expect(
			jest
				.mocked( recordBoostEvent )
				.mock.calls.filter( ( [ name ] ) => name === 'settings_group_view' )
		).toEqual( [] );
		exposeHeaders();
		expect(
			jest
				.mocked( recordBoostEvent )
				.mock.calls.filter( ( [ name ] ) => name === 'settings_group_view' )
		).toHaveLength( 4 );
	} );

	it( 'records find-in-page opening as live state without a click toggle', () => {
		render( <Settings /> );
		const header = screen.getByRole( 'button', { name: 'Cornerstone Pages' } );
		const content = screen
			.getByText( 'cornerstone description' )
			.closest( '[hidden="until-found"]' );
		fireEvent( content as HTMLElement, new Event( 'beforematch' ) );
		expect( header.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
		expect( recordBoostEvent ).not.toHaveBeenCalled();
		exposeHeaders();
		expect( recordBoostEvent ).toHaveBeenCalledWith( 'settings_group_view', {
			group: 'cornerstone_pages',
			initial_open: 1,
		} );
	} );

	it( 'records intentional group changes only, using stable slugs', () => {
		render( <Settings /> );
		expect( recordBoostEvent ).not.toHaveBeenCalled();
		for ( const [ name, group, initial ] of [
			[ 'Cornerstone Pages', 'cornerstone_pages', 'open' ],
			[ 'Page loading', 'page_loading', 'close' ],
			[ 'Code optimization', 'code_optimization', 'close' ],
			[ 'Images', 'images', 'close' ],
		] ) {
			const button = screen.getByRole( 'button', { name } );
			fireEvent.click( button );
			expect( recordBoostEvent ).toHaveBeenLastCalledWith( 'settings_group_toggle', {
				group,
				status: initial,
			} );
			fireEvent.click( button );
			expect( recordBoostEvent ).toHaveBeenLastCalledWith( 'settings_group_toggle', {
				group,
				status: initial === 'open' ? 'close' : 'open',
			} );
		}
		expect( recordBoostEvent ).toHaveBeenCalledTimes( 8 );
	} );
} );
