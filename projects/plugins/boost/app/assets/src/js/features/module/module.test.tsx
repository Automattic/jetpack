/* No jest-dom in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-text-content, jest-dom/prefer-checked, jest-dom/prefer-enabled-disabled, testing-library/no-container, testing-library/no-node-access */
import { render, screen } from '@testing-library/react';
import Module from './module';
import { ModuleSurfaceProvider } from './surface';

jest.mock( './lib/stores', () => ( {
	useSingleModuleState: () => [ mockState, jest.fn() ],
} ) );
jest.mock( '$features/notice/context', () => ( {
	useNotices: () => ( { setNotice: jest.fn() } ),
} ) );

let mockState: { active: boolean; available: boolean } | undefined;

const boostGlobal = { site: { online: true, host: '' }, developmentFeatures: [] as string[] };

const renderModule = ( ui: React.ReactElement, row: boolean ) =>
	render( row ? <ModuleSurfaceProvider value="row">{ ui }</ModuleSurfaceProvider> : ui );

describe( 'Module', () => {
	beforeEach( () => {
		mockState = { active: true, available: true };
		boostGlobal.site.online = true;
		boostGlobal.site.host = '';
		( globalThis as unknown as { Jetpack_Boost: typeof boostGlobal } ).Jetpack_Boost = boostGlobal;
	} );

	it( 'renders a block with a heading and an unlabelled toggle without a surface provider', () => {
		const { container } = renderModule(
			<Module slug="minify_js" title="Concatenate JS" description={ <p>Desc</p> }>
				<span>child</span>
			</Module>,
			false
		);

		expect( screen.getByRole( 'heading', { level: 3 } ).textContent ).toBe( 'Concatenate JS' );
		expect( screen.getByRole( 'checkbox', { name: '' } ) ).toBeTruthy();
		expect( container.querySelector( '.jb-feature-toggle-minify_js' ) ).not.toBeNull();
		expect( screen.getByText( 'child' ) ).toBeTruthy();
	} );

	it( 'renders a labelled toggle row under the row surface', () => {
		const { container } = renderModule(
			<Module slug="minify_js" title="Concatenate JS" description={ <p>Desc</p> }>
				<span>child</span>
			</Module>,
			true
		);

		expect( screen.getByRole( 'checkbox', { name: 'Concatenate JS' } ) ).toBeTruthy();
		expect( screen.queryByRole( 'heading' ) ).toBeNull();
		expect( screen.getByText( 'Desc' ) ).toBeTruthy();
		expect( screen.getByText( 'child' ) ).toBeTruthy();
		expect( screen.getByTestId( 'module-minify_js' ) ).toBeTruthy();
		expect( container.querySelector( '.jb-feature-toggle-minify_js' ) ).not.toBeNull();
	} );

	it( 'hides children while the module is inactive on both surfaces', () => {
		mockState = { active: false, available: true };

		for ( const row of [ false, true ] ) {
			const view = renderModule(
				<Module slug="minify_js" title="Concatenate JS" description="Desc">
					<span>child</span>
				</Module>,
				row
			);
			expect( screen.queryByText( 'child' ) ).toBeNull();
			view.unmount();
		}
	} );

	it( 'renders nothing for an unavailable module on both surfaces', () => {
		mockState = { active: false, available: false };

		for ( const row of [ false, true ] ) {
			const view = renderModule(
				<Module slug="minify_js" title="Concatenate JS" description="Desc" />,
				row
			);
			expect( screen.queryByText( 'Concatenate JS' ) ).toBeNull();
			view.unmount();
		}
	} );

	it.each( [ 'woa', 'atomic' ] )(
		'shows unavailable Page Cache as on but disabled when the host is %s',
		host => {
			mockState = { active: false, available: false };
			boostGlobal.site.host = host;

			for ( const row of [ false, true ] ) {
				const view = renderModule(
					<Module slug="page_cache" title="Cache Site Pages" description="Desc" />,
					row
				);
				const toggle = screen.getByRole( 'checkbox' ) as HTMLInputElement;
				expect( toggle.checked ).toBe( true );
				expect( toggle.disabled ).toBe( true );
				view.unmount();
			}
		}
	);

	it( 'shows unavailable Page Cache as off and disabled on other hosts', () => {
		mockState = { active: false, available: false };
		boostGlobal.site.host = 'other';

		for ( const row of [ false, true ] ) {
			const view = renderModule(
				<Module slug="page_cache" title="Cache Site Pages" description="Desc" />,
				row
			);
			const toggle = screen.getByRole( 'checkbox' ) as HTMLInputElement;
			expect( toggle.checked ).toBe( false );
			expect( toggle.disabled ).toBe( true );
			view.unmount();
		}
	} );

	it( 'shows the offline notice instead of children in a row', () => {
		boostGlobal.site.online = false;

		renderModule(
			<Module slug="image_cdn" title="Image CDN" description="Desc" worksOffline={ false }>
				<span>child</span>
			</Module>,
			true
		);

		// The notice also speaks its text into a live region.
		expect( screen.getAllByText( /not publicly available/ ).length ).toBeGreaterThan( 0 );
		expect( screen.queryByText( 'child' ) ).toBeNull();
	} );

	it( 'falls back to an error notice in a row when the module throws', () => {
		const Boom = () => {
			throw new Error( 'kaboom' );
		};
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );

		renderModule(
			<Module slug="minify_js" title="Concatenate JS" description="Desc">
				<Boom />
			</Module>,
			true
		);

		expect( screen.getByText( 'Failed to load module' ) ).toBeTruthy();
		expect( screen.getByRole( 'heading', { level: 3 } ).textContent ).toBe( 'Concatenate JS' );
		expect( screen.getByText( 'Error: kaboom' ) ).toBeTruthy();
	} );
} );
