/* No jest-dom in this project. */
/* eslint-disable jest-dom/prefer-in-document, testing-library/prefer-user-event, jest-dom/prefer-to-have-text-content, jest-dom/prefer-checked, jest-dom/prefer-enabled-disabled, testing-library/no-container, testing-library/no-node-access */
import { fireEvent, render, screen } from '@testing-library/react';
import Module from './module';
import { recordBoostEvent } from '$lib/utils/analytics';

jest.mock( './lib/stores', () => ( {
	useSingleModuleState: () => [ mockState, mockSetStatus ],
} ) );
jest.mock( '$features/notice/context', () => ( {
	useNotices: () => ( { setNotice: jest.fn() } ),
} ) );

jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );
const mockSetStatus = jest.fn();

let mockState: { active: boolean; available: boolean } | undefined;

const boostGlobal = { site: { online: true, host: '' }, developmentFeatures: [] as string[] };

describe( 'Module', () => {
	beforeEach( () => {
		mockState = { active: true, available: true };
		mockSetStatus.mockClear();
		jest.mocked( recordBoostEvent ).mockClear();
		boostGlobal.site.online = true;
		boostGlobal.site.host = '';
		( globalThis as unknown as { Jetpack_Boost: typeof boostGlobal } ).Jetpack_Boost = boostGlobal;
	} );

	it( 'records each intentional module toggle', () => {
		const view = render( <Module slug="minify_js" title="Concatenate JS" description="Desc" /> );
		expect( recordBoostEvent ).not.toHaveBeenCalled();
		fireEvent.click( screen.getByRole( 'checkbox' ) );
		expect( recordBoostEvent ).toHaveBeenLastCalledWith( 'module_toggle_clicked', {
			module: 'minify_js',
			status: 'off',
		} );
		expect( mockSetStatus ).toHaveBeenLastCalledWith( false );
		mockState = { active: false, available: true };
		view.unmount();
		render( <Module slug="minify_js" title="Concatenate JS" description="Desc" /> );
		fireEvent.click( screen.getByRole( 'checkbox' ) );
		expect( recordBoostEvent ).toHaveBeenLastCalledWith( 'module_toggle_clicked', {
			module: 'minify_js',
			status: 'on',
		} );
		expect( mockSetStatus ).toHaveBeenLastCalledWith( true );
		expect( recordBoostEvent ).toHaveBeenCalledTimes( 2 );
	} );

	it( 'renders a labelled toggle row', () => {
		const { container } = render(
			<Module slug="minify_js" title="Concatenate JS" description={ <p>Desc</p> }>
				<span>child</span>
			</Module>
		);

		expect( screen.getByRole( 'checkbox', { name: 'Concatenate JS' } ) ).toBeTruthy();
		expect( screen.queryByRole( 'heading' ) ).toBeNull();
		expect( screen.getByText( 'Desc' ) ).toBeTruthy();
		expect( screen.getByText( 'child' ) ).toBeTruthy();
		expect( screen.getByTestId( 'module-minify_js' ) ).toBeTruthy();
		expect( container.querySelector( '.jb-feature-toggle-minify_js' ) ).not.toBeNull();
	} );

	it( 'hides children while the module is inactive', () => {
		mockState = { active: false, available: true };

		render(
			<Module slug="minify_js" title="Concatenate JS" description="Desc">
				<span>child</span>
			</Module>
		);
		expect( screen.queryByText( 'child' ) ).toBeNull();
	} );

	it( 'renders nothing for an unavailable module', () => {
		mockState = { active: false, available: false };

		render( <Module slug="minify_js" title="Concatenate JS" description="Desc" /> );
		expect( screen.queryByText( 'Concatenate JS' ) ).toBeNull();
	} );

	it.each( [ 'woa', 'atomic' ] )(
		'shows unavailable Page Cache as on but disabled when the host is %s',
		host => {
			mockState = { active: false, available: false };
			boostGlobal.site.host = host;

			render( <Module slug="page_cache" title="Cache Site Pages" description="Desc" /> );
			const toggle = screen.getByRole( 'checkbox' ) as HTMLInputElement;
			expect( toggle.checked ).toBe( true );
			expect( toggle.disabled ).toBe( true );
		}
	);

	it( 'shows unavailable Page Cache as off and disabled on other hosts', () => {
		mockState = { active: false, available: false };
		boostGlobal.site.host = 'other';

		render( <Module slug="page_cache" title="Cache Site Pages" description="Desc" /> );
		const toggle = screen.getByRole( 'checkbox' ) as HTMLInputElement;
		expect( toggle.checked ).toBe( false );
		expect( toggle.disabled ).toBe( true );
	} );

	it( 'shows the offline notice instead of children', () => {
		boostGlobal.site.online = false;

		render(
			<Module slug="image_cdn" title="Image CDN" description="Desc" worksOffline={ false }>
				<span>child</span>
			</Module>
		);

		// The notice also speaks its text into a live region.
		expect( screen.getAllByText( /not publicly available/ ).length ).toBeGreaterThan( 0 );
		expect( screen.queryByText( 'child' ) ).toBeNull();
	} );

	it( 'falls back to an error notice when the module throws', () => {
		const Boom = () => {
			throw new Error( 'kaboom' );
		};
		jest.spyOn( console, 'error' ).mockImplementation( () => {} );

		render(
			<Module slug="minify_js" title="Concatenate JS" description="Desc">
				<Boom />
			</Module>
		);

		expect( screen.getByText( 'Failed to load module' ) ).toBeTruthy();
		expect( screen.getByRole( 'heading', { level: 4 } ).textContent ).toBe( 'Concatenate JS' );
		expect( screen.getByText( 'Error: kaboom' ) ).toBeTruthy();
	} );
} );
