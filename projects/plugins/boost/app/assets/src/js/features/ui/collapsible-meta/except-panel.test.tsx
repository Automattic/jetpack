/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-attribute, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-value, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
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
		trigger: 'Exclude URL patterns',
		count: false,
	},
	...( [ 'js', 'css' ] as const ).map( type => ( {
		name: `Concatenate ${ type }`,
		component: (
			<MinifyMeta
				datasyncKey={ `minify_${ type }_excludes` }
				buttonText={ `Exclude ${ type.toUpperCase() } handles` }
				placeholder="Handles"
			/>
		),
		trigger: `Exclude ${ type.toUpperCase() } handles`,
		count: false,
	} ) ),
	{ name: 'Page Cache', component: <PageCacheMeta />, trigger: 'Show Options', count: true },
];

beforeEach( () => {
	mockValues = [];
	mockMutate.mockClear();
} );

describe.each( consumers )( '$name', ( { component, trigger, count } ) => {
	it( 'shows None, expands an unchanged disabled Save, and saves the existing list format', () => {
		render( <ModuleSurfaceProvider value="row">{ component }</ModuleSurfaceProvider> );
		const toggle = screen.getByRole( 'button', { name: 'Except None' } );
		expect( toggle.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
		expect( screen.queryByRole( 'textbox' ) ).toBeNull();
		fireEvent.click( toggle );
		expect( toggle.getAttribute( 'aria-expanded' ) ).toBe( 'true' );
		const save = screen.getByRole< HTMLButtonElement >( 'button', { name: 'Save' } );
		expect( save.disabled ).toBe( true );
		fireEvent.change( screen.getByRole( 'textbox' ), {
			target: { value: count ? 'checkout\n about ' : 'checkout, about ' },
		} );
		expect( save.disabled ).toBe( false );
		fireEvent.click( save );
		expect( mockMutate.mock.calls[ 0 ][ 0 ] ).toEqual( [ 'checkout', 'about' ] );
		fireEvent.click( toggle );
		expect( screen.queryByRole( 'textbox' ) ).toBeNull();
	} );

	it( 'summarizes saved exceptions and disables Save until the value changes', () => {
		mockValues = [ 'checkout', 'about' ];
		render( <ModuleSurfaceProvider value="row">{ component }</ModuleSurfaceProvider> );
		fireEvent.click(
			screen.getByRole( 'button', { name: count ? 'Except 2 pages' : 'Except checkout, about' } )
		);
		expect( screen.getByRole< HTMLButtonElement >( 'button', { name: 'Save' } ).disabled ).toBe(
			true
		);
	} );

	it( 'retains its legacy trigger', () => {
		render( component );
		expect( screen.queryByRole( 'button', { name: /^Except / } ) ).toBeNull();
		fireEvent.click( screen.getByRole( 'button', { name: trigger } ) );
		expect( screen.getByRole< HTMLButtonElement >( 'button', { name: 'Save' } ).disabled ).toBe(
			true
		);
	} );
} );

it( 'keeps invalid Page Cache patterns disabled and counts only nonempty patterns', () => {
	mockValues = [ 'checkout', '' ];
	render(
		<ModuleSurfaceProvider value="row">
			<PageCacheMeta />
		</ModuleSurfaceProvider>
	);
	fireEvent.click( screen.getByRole( 'button', { name: 'Except 1 page' } ) );
	fireEvent.change( screen.getByRole( 'textbox' ), { target: { value: '[' } } );
	expect( screen.getByRole< HTMLButtonElement >( 'button', { name: 'Save' } ).disabled ).toBe(
		true
	);
} );

it.each( [ 'js', 'css' ] as const )( 'keeps Load default handles for Concatenate %s', type => {
	render(
		<ModuleSurfaceProvider value="row">
			<MinifyMeta
				datasyncKey={ `minify_${ type }_excludes` }
				buttonText="Exclude"
				placeholder="Handles"
			/>
		</ModuleSurfaceProvider>
	);
	fireEvent.click( screen.getByRole( 'button', { name: 'Except None' } ) );
	fireEvent.click( screen.getByRole( 'button', { name: 'Load default handles' } ) );
	expect( screen.getByRole< HTMLInputElement >( 'textbox' ).value ).toBe( 'jquery' );
	expect( screen.getByRole< HTMLButtonElement >( 'button', { name: 'Save' } ).disabled ).toBe(
		false
	);
} );
