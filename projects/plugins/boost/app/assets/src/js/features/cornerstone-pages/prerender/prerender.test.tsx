/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-checked, jest-dom/prefer-to-have-text-content, jest-dom/prefer-to-have-attribute, testing-library/prefer-user-event, testing-library/no-container, testing-library/no-node-access */
import { fireEvent, render, screen } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import Prerender from './prerender';

jest.mock( '$features/module/lib/stores', () => ( {
	useSingleModuleState: ( _slug: string, onSuccess: ( active: boolean ) => void ) => [
		mockState,
		( active: boolean ) => {
			mockSetState( active );
			onSuccess( active );
		},
	],
} ) );
jest.mock( '$features/notice/context', () => ( {
	useNotices: () => ( { setNotice: mockSetNotice } ),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

let mockState: { active: boolean; available: boolean } | undefined;
const mockSetState = jest.fn();
const mockSetNotice = jest.fn();

const renderPrerender = ( row: boolean ) =>
	render(
		row ? (
			<ModuleSurfaceProvider value="row">
				<Prerender />
			</ModuleSurfaceProvider>
		) : (
			<Prerender />
		)
	);

describe( 'Prerender', () => {
	beforeEach( () => {
		mockState = { active: false, available: true };
		jest.clearAllMocks();
	} );

	it( 'renders a heading and an unlabelled toggle as a block', () => {
		const { container } = renderPrerender( false );

		expect( screen.getByRole( 'heading', { level: 4 } ).textContent ).toBe(
			'Prerender Cornerstone Pages'
		);
		expect( screen.getByRole( 'checkbox', { name: '' } ) ).toBeTruthy();
		expect(
			container.querySelector( '[data-testid="prerender-cornerstone-pages-title"]' )
		).not.toBeNull();
	} );

	it( 'renders a labelled toggle as a row, under the same test id', () => {
		const { container } = renderPrerender( true );

		expect( screen.getByRole( 'checkbox', { name: 'Prerender Cornerstone Pages' } ) ).toBeTruthy();
		expect( screen.queryByRole( 'heading' ) ).toBeNull();
		expect(
			container.querySelector( '[data-testid="prerender-cornerstone-pages-title"]' )
		).not.toBeNull();
	} );

	it( 'saves the module state, records the toggle, and notices the result', () => {
		const { recordBoostEvent } = jest.requireMock( '$lib/utils/analytics' );
		renderPrerender( true );

		fireEvent.click( screen.getByRole( 'checkbox' ) );

		expect( mockSetState ).toHaveBeenCalledWith( true );
		expect( recordBoostEvent ).toHaveBeenCalledWith( 'cornerstone_pages_prerender_toggle', {
			enabled: 1,
		} );
		expect( mockSetNotice ).toHaveBeenCalledWith(
			expect.objectContaining( { type: 'success', message: 'Prerender enabled' } )
		);
	} );

	it.each( [ false, true ] )( 'closes the warning with Escape (row: %s)', row => {
		renderPrerender( row );
		const trigger = screen.getByRole( 'button', { name: 'be mindful' } );
		trigger.focus();
		fireEvent.click( trigger );
		expect( screen.getByText( /Prerendering pages can be unsafe/ ) ).toBeTruthy();
		fireEvent.keyDown( trigger, { key: 'Escape' } );
		expect( screen.queryByText( /Prerendering pages can be unsafe/ ) ).toBeNull();
		expect( trigger.ownerDocument.activeElement ).toBe( trigger );
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
	} );

	it( 'closes the warning on a press elsewhere', () => {
		renderPrerender( false );
		fireEvent.click( screen.getByRole( 'button', { name: 'be mindful' } ) );
		fireEvent.pointerDown( document.body );
		expect( screen.queryByText( /Prerendering pages can be unsafe/ ) ).toBeNull();
	} );

	it( 'reflects an enabled module', () => {
		mockState = { active: true, available: true };
		renderPrerender( false );

		expect( ( screen.getByRole( 'checkbox' ) as HTMLInputElement ).checked ).toBe( true );
	} );

	it( 'toggles the warning tooltip from the "be mindful" link and records the click', () => {
		const { recordBoostEvent } = jest.requireMock( '$lib/utils/analytics' );
		renderPrerender( false );

		expect( screen.queryByText( /Prerendering pages can be unsafe/ ) ).toBeNull();
		fireEvent.click( screen.getByRole( 'button', { name: 'be mindful' } ) );

		expect( recordBoostEvent ).toHaveBeenCalledWith( 'prerender_warning_message_clicked', {} );
		expect( screen.getByText( /Prerendering pages can be unsafe/ ) ).toBeTruthy();
		expect( screen.getByRole( 'link', { name: /^Learn more/ } ).getAttribute( 'href' ) ).toContain(
			'jetpack-boost-unsafe-speculation-rules'
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'be mindful' } ) );
		expect( screen.queryByText( /Prerendering pages can be unsafe/ ) ).toBeNull();
	} );
} );
