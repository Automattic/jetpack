/* No jest-dom in this project. */
/* eslint-disable jest-dom/prefer-in-document, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import Index from './index';

/* `Module` is replaced with a shell that exposes what each feature hands it. */
jest.mock( '$features/module/module', () => ( props: ModuleShellProps ) => (
	<section data-testid={ `module-${ props.slug }` }>
		<h3>{ props.title }</h3>
		{ props.description }
		{ props.onEnable && <button onClick={ () => props.onEnable?.() }>enable</button> }
		{ props.children }
	</section>
) );
jest.mock( '$features/cornerstone-pages/cornerstone-pages', () => () => <div>cornerstone</div> );
jest.mock( '$features/lcp/lcp', () => () => <div data-testid="module-lcp" /> );
jest.mock( '$features/page-cache/page-cache', () => () => <div data-testid="module-page_cache" /> );
jest.mock( '$features/minify-js/minify-js', () => () => <div data-testid="module-minify_js" /> );
jest.mock( '$features/minify-css/minify-css', () => () => <div data-testid="module-minify_css" /> );
jest.mock( '$features/image-guide/image-guide', () => () => (
	<div data-testid="module-image_guide" />
) );
jest.mock( '$features/critical-css/critical-css-meta/critical-css-meta', () => () => (
	<div>critical css meta</div>
) );
jest.mock( '$features/critical-css/cloud-css-meta/cloud-css-meta', () => () => (
	<div>cloud css meta</div>
) );
jest.mock( '$features/render-blocking-js/render-blocking-js-meta', () => () => (
	<div>defer js meta</div>
) );
jest.mock( '$features/image-cdn/image-cdn-liar/image-cdn-liar', () => ( { isPremium }: Flag ) => (
	<div>liar:{ String( isPremium ) }</div>
) );
jest.mock(
	'$features/image-cdn/quality-settings/quality-settings',
	() =>
		( { isPremium }: Flag ) => <div>quality:{ String( isPremium ) }</div>
);
jest.mock( '$features/premium-tooltip/premium-tooltip', () => () => <span>tooltip</span> );
jest.mock( '$features/upgrade-cta/interstitial-modal-cta', () => ( { identifier }: Cta ) => (
	<div>upgrade:{ identifier }</div>
) );
jest.mock( '$features/critical-css/lib/stores/critical-css-state', () => ( {
	useRegenerateCriticalCssAction: () => ( { mutate: mockRegenerate } ),
} ) );
jest.mock( '$features/module/lib/stores', () => ( {
	useSingleModuleState: ( slug: string ) => [ mockModules[ slug ] ],
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

type ModuleShellProps = {
	slug: string;
	title: React.ReactNode;
	description: React.ReactNode;
	children?: React.ReactNode;
	onEnable?: () => void;
};
type Flag = { isPremium: boolean };
type Cta = { identifier: string };

const mockRegenerate = jest.fn();
let mockModules: Record< string, { active: boolean; available: boolean } | undefined >;

describe( 'Index', () => {
	beforeEach( () => {
		mockRegenerate.mockClear();
		mockModules = {};
	} );

	it( 'renders the modules in the legacy order', () => {
		render( <Index /> );

		expect( screen.getByText( 'cornerstone' ) ).toBeTruthy();
		expect( screen.getAllByTestId( /^module-/ ).map( el => el.dataset.testid ) ).toEqual( [
			'module-critical_css',
			'module-cloud_css',
			'module-lcp',
			'module-page_cache',
			'module-render_blocking_js',
			'module-minify_js',
			'module-minify_css',
			'module-image_cdn',
			'module-image_guide',
		] );
	} );

	it( 'regenerates critical CSS when either CSS module is enabled', () => {
		render( <Index /> );

		const [ manual, cloud ] = screen.getAllByRole( 'button', { name: 'enable' } );
		fireEvent.click( manual );
		fireEvent.click( cloud );

		expect( mockRegenerate ).toHaveBeenCalledTimes( 2 );
		expect( screen.getByText( 'critical css meta' ) ).toBeTruthy();
		expect( screen.getByText( 'cloud css meta' ) ).toBeTruthy();
		expect( screen.getByText( 'upgrade:critical-css' ) ).toBeTruthy();
		expect( screen.getByText( 'defer js meta' ) ).toBeTruthy();
	} );

	it( 'records the documentation link clicks', () => {
		const { recordBoostEvent } = jest.requireMock( '$lib/utils/analytics' );
		render( <Index /> );

		for ( const link of screen.getAllByRole( 'link', { name: /Critical CSS/ } ) ) {
			fireEvent.click( link );
		}
		fireEvent.click( screen.getByRole( 'link', { name: /web\.dev/ } ) );

		expect( recordBoostEvent.mock.calls.map( ( [ name ]: [ string ] ) => name ) ).toEqual( [
			'critical_css_link_clicked',
			'critical_css_link_clicked',
			'defer_js_link_clicked',
		] );
	} );

	it( 'offers the Image CDN upgrade until both premium CDN features are available', () => {
		render( <Index /> );
		expect( screen.getByText( 'upgrade:image-cdn' ) ).toBeTruthy();
		expect( screen.getByText( 'liar:false' ) ).toBeTruthy();
		expect( screen.getByText( 'quality:false' ) ).toBeTruthy();
	} );

	it( 'drops the Image CDN upgrade once both premium CDN features are available', () => {
		mockModules = {
			image_cdn_quality: { active: true, available: true },
			image_cdn_liar: { active: true, available: true },
		};
		render( <Index /> );

		expect( screen.queryByText( 'upgrade:image-cdn' ) ).toBeNull();
		expect( screen.getByText( 'liar:true' ) ).toBeTruthy();
		expect( screen.getByText( 'quality:true' ) ).toBeTruthy();
	} );
} );
