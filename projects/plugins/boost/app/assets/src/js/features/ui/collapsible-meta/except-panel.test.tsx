/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-to-have-value, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { recordBoostEvent } from '$lib/utils/analytics';
import RenderBlockingJsMeta from '$features/render-blocking-js/render-blocking-js-meta';
import MinifyMeta from '$features/minify-meta/minify-meta';
import PageCacheMeta from '$features/page-cache/meta/meta';

const mockMutate = jest.fn();
let mockValues: string[] = [];
jest.mock( '@automattic/jetpack-react-data-sync-client', () => ( {
	useDataSync: () => [ { data: mockValues }, { mutate: mockMutate } ],
	useDataSyncSubset: ( _query: unknown, key: string ) => [
		key === 'logging' ? false : mockValues,
		{ mutate: mockMutate, isError: false },
	],
} ) );
jest.mock( '$features/page-cache/meta/meta.module.scss', () => ( {
	body: 'page-cache-body',
	section: 'page-cache-section',
} ) );
jest.mock( '$lib/stores/page-cache', () => ( {
	usePageCache: () => ( {} ),
	useClearPageCacheAction: () => [ '', { mutate: jest.fn() } ],
} ) );
jest.mock( '$features/minify-meta/lib/stores', () => ( {
	useMinifyDefaults: () => [ 'jquery' ],
} ) );
jest.mock( '$features/notice/context', () => ( {
	useNotices: () => ( { setNotice: jest.fn() } ),
} ) );
jest.mock( '$features/ui', () => ( { useMutationNotice: jest.fn() } ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

const consumers = [
	{
		name: 'Defer JS',
		component: <RenderBlockingJsMeta />,
		count: false,
	},
	...( [ 'js', 'css' ] as const ).map( type => ( {
		name: `Concatenate ${ type }`,
		component: <MinifyMeta datasyncKey={ `minify_${ type }_excludes` } placeholder="Handles" />,
		count: false,
	} ) ),
	{ name: 'Page Cache', component: <PageCacheMeta />, count: true },
];

beforeEach( () => {
	mockValues = [];
	mockMutate.mockClear();
	jest.mocked( recordBoostEvent ).mockClear();
} );

describe.each( consumers )( '$name', ( { component, count } ) => {
	it( 'shows None, expands an unchanged disabled Save, and saves the existing list format', () => {
		render( component );
		const toggle = screen.getByRole( 'button', { name: 'Except None' } );
		expect( toggle.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
		expect( screen.queryByRole( 'textbox' ) ).toBeNull();
		fireEvent.click( toggle );
		expect( toggle.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
		const save = screen.getByRole< HTMLButtonElement >( 'button', { name: 'Save' } );
		expect( save.getAttribute( 'aria-disabled' ) ).toBe( 'true' );
		fireEvent.change( screen.getByRole( 'textbox' ), {
			target: { value: count ? 'checkout\n about ' : 'checkout, about ' },
		} );
		expect( save.getAttribute( 'aria-disabled' ) ).toBe( 'false' );
		fireEvent.click( save );
		expect( mockMutate.mock.calls[ 0 ][ 0 ] ).toEqual( [ 'checkout', 'about' ] );
		fireEvent.click( toggle );
		expect( screen.queryByRole( 'textbox' ) ).toBeNull();
	} );

	it( 'summarizes saved exceptions and disables Save until the value changes', () => {
		mockValues = [ 'checkout', 'about' ];
		render( component );
		fireEvent.click(
			screen.getByRole( 'button', { name: count ? 'Except 2 pages' : 'Except checkout, about' } )
		);
		expect( screen.getByRole( 'button', { name: 'Save' } ).getAttribute( 'aria-disabled' ) ).toBe(
			'true'
		);
	} );
} );

it( 'keeps invalid Page Cache patterns disabled and counts only nonempty patterns', () => {
	mockValues = [ 'checkout', '' ];
	render( <PageCacheMeta /> );
	fireEvent.click( screen.getByRole( 'button', { name: 'Except 1 page' } ) );
	fireEvent.change( screen.getByRole( 'textbox' ), { target: { value: '[' } } );
	expect( screen.getByRole( 'button', { name: 'Save' } ).getAttribute( 'aria-disabled' ) ).toBe(
		'true'
	);
} );

it.each( [ 'js', 'css' ] as const )( 'keeps Load default handles for Concatenate %s', type => {
	render( <MinifyMeta datasyncKey={ `minify_${ type }_excludes` } placeholder="Handles" /> );
	fireEvent.click( screen.getByRole( 'button', { name: 'Except None' } ) );
	fireEvent.click( screen.getByRole( 'button', { name: 'Load default handles' } ) );
	expect( screen.getByRole< HTMLInputElement >( 'textbox' ).value ).toBe( 'jquery' );
	expect( screen.getByRole( 'button', { name: 'Save' } ).getAttribute( 'aria-disabled' ) ).toBe(
		'false'
	);
} );

it( 'records the Page Cache Except toggle events', () => {
	render( <PageCacheMeta /> );
	const except = screen.getByRole( 'button', { name: 'Except None' } );
	fireEvent.click( except );
	expect( recordBoostEvent ).toHaveBeenLastCalledWith( 'page_cache_exceptions_panel_toggle', {
		panel_scope: 'exceptions',
		status: 'open',
	} );
	fireEvent.click( except );
	expect( recordBoostEvent ).toHaveBeenLastCalledWith( 'page_cache_exceptions_panel_toggle', {
		panel_scope: 'exceptions',
		status: 'close',
	} );
	expect( recordBoostEvent ).toHaveBeenCalledTimes( 2 );
} );

it( 'keeps the Page Cache textarea section inside its styling body and panel', () => {
	render( <PageCacheMeta /> );
	const toggle = screen.getByRole( 'button', { name: 'Except None' } );
	fireEvent.click( toggle );
	// eslint-disable-next-line testing-library/no-node-access
	const body = screen.getByRole( 'textbox' ).closest( '.page-cache-section' )?.parentElement;
	expect( body?.className ).toBe( 'page-cache-body' );
	expect(
		// eslint-disable-next-line testing-library/no-node-access
		document.getElementById( toggle.getAttribute( 'aria-controls' )! )?.contains( body! )
	).toBe( true );
} );

it.each( consumers.filter( consumer => ! consumer.count ) )(
	'$name labels its field and explains the exceptions',
	( { name, component } ) => {
		const label =
			name === 'Defer JS'
				? 'Add URLs or patterns separated with a comma:'
				: 'Add handles separated with a comma:';
		const help =
			name === 'Defer JS'
				? "JavaScript won't be deferred on these pages."
				: `${ name.endsWith( 'js' ) ? 'Scripts' : 'Styles' } listed here will be excluded from concatenation and minification. They continue loading separately.`;
		render( component );
		fireEvent.click( screen.getByRole( 'button', { name: 'Except None' } ) );
		expect( screen.getByRole( 'textbox', { name: label } ) ).toBeTruthy();
		expect( screen.getByText( help, { exact: false } ) ).toBeTruthy();
	}
);
