/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-checked, jest-dom/prefer-to-have-attribute, testing-library/prefer-user-event, testing-library/no-container, testing-library/no-node-access */
import { fireEvent, render, screen } from '@testing-library/react';
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

// speak() also writes the warning into `@wordpress/a11y`'s live region, so match the tooltip only.
const warning = () =>
	screen.queryByText( /Prerendering pages can be unsafe/, {
		ignore: '#a11y-speak-polite, script, style',
	} );

describe( 'Prerender', () => {
	beforeEach( () => {
		mockState = { active: false, available: true };
		jest.clearAllMocks();
	} );

	it( 'renders a labelled toggle under the title test id', () => {
		const { container } = render( <Prerender /> );

		expect( screen.getByRole( 'checkbox', { name: 'Prerender Cornerstone Pages' } ) ).toBeTruthy();
		expect( screen.queryByRole( 'heading' ) ).toBeNull();
		expect(
			container.querySelector( '[data-testid="prerender-cornerstone-pages-title"]' )
		).not.toBeNull();
	} );

	it( 'saves the module state, records the toggle, and notices the result', () => {
		const { recordBoostEvent } = jest.requireMock( '$lib/utils/analytics' );
		render( <Prerender /> );

		fireEvent.click( screen.getByRole( 'checkbox' ) );

		expect( mockSetState ).toHaveBeenCalledWith( true );
		expect( recordBoostEvent ).toHaveBeenCalledWith( 'cornerstone_pages_prerender_toggle', {
			enabled: 1,
		} );
		expect( mockSetNotice ).toHaveBeenCalledWith(
			expect.objectContaining( { type: 'success', message: 'Prerender enabled' } )
		);
	} );

	it( 'closes the warning with Escape', () => {
		render( <Prerender /> );
		const trigger = screen.getByRole( 'button', { name: 'be mindful' } );
		trigger.focus();
		fireEvent.click( trigger );
		expect( warning() ).toBeTruthy();
		fireEvent.keyDown( trigger, { key: 'Escape' } );
		expect( warning() ).toBeNull();
		expect( trigger.ownerDocument.activeElement ).toBe( trigger );
		expect( trigger.getAttribute( 'aria-expanded' ) ).toBe( 'false' );
	} );

	it( 'closes the warning on a press elsewhere', () => {
		render( <Prerender /> );
		fireEvent.click( screen.getByRole( 'button', { name: 'be mindful' } ) );
		fireEvent.pointerDown( document.body );
		expect( warning() ).toBeNull();
	} );

	it( 'reflects an enabled module', () => {
		mockState = { active: true, available: true };
		render( <Prerender /> );

		expect( ( screen.getByRole( 'checkbox' ) as HTMLInputElement ).checked ).toBe( true );
	} );

	it( 'toggles the warning tooltip from the "be mindful" link and records the click', () => {
		const { recordBoostEvent } = jest.requireMock( '$lib/utils/analytics' );
		render( <Prerender /> );

		expect( warning() ).toBeNull();
		fireEvent.click( screen.getByRole( 'button', { name: 'be mindful' } ) );

		expect( recordBoostEvent ).toHaveBeenCalledWith( 'prerender_warning_message_clicked', {} );
		expect( warning() ).toBeTruthy();
		expect( screen.getByRole( 'link', { name: /^Learn more/ } ).getAttribute( 'href' ) ).toContain(
			'jetpack-boost-unsafe-speculation-rules'
		);

		fireEvent.click( screen.getByRole( 'button', { name: 'be mindful' } ) );
		expect( warning() ).toBeNull();
	} );
} );
