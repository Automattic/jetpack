/* No jest-dom or user-event in this project; a click is all the header needs. */
/* eslint-disable jest-dom/prefer-in-document, jest-dom/prefer-to-have-text-content, testing-library/prefer-user-event, testing-library/no-node-access */
import { fireEvent, render, screen } from '@testing-library/react';
import CornerstonePagesCard from './cornerstone-pages-card';

jest.mock( './cornerstone-pages', () => ( { useCornerstoneSummary: () => mockSummary } ) );
jest.mock( './meta/meta', () => ( {
	CornerstonePagesDescription: () => <>description</>,
	CornerstonePagesEditor: () => <div>editor</div>,
	CornerstonePagesUpgradeCTA: () => <div>upgrade</div>,
} ) );
jest.mock( './prerender/prerender', () => () => <div>prerender</div> );
jest.mock( '$features/module/lib/stores', () => ( {
	useSingleModuleState: () => [ mockSpeculationRules ],
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

let mockSummary: string | null;
let mockSpeculationRules: { active: boolean; available: boolean } | undefined;

describe( 'CornerstonePagesCard', () => {
	beforeEach( () => {
		mockSummary = 'Added: Homepage + 2 pages';
		mockSpeculationRules = { active: false, available: true };
	} );

	it( 'describes the feature under the title, then summarises the list on the editor header', () => {
		render( <CornerstonePagesCard /> );

		expect( screen.getByRole( 'heading', { level: 2 } ).textContent ).toBe( 'Cornerstone pages' );
		expect( screen.getByText( 'description' ).tagName ).toBe( 'P' );
		expect( screen.getByRole( 'button', { name: /Edit pages/ } ) ).toBeTruthy();
		expect( screen.getByText( 'prerender' ) ).toBeTruthy();
	} );

	it( 'puts the summary before "Edit pages" on the trigger, with the description outside it', () => {
		render( <CornerstonePagesCard /> );
		const trigger = screen.getByRole( 'button', { name: /Edit pages/ } );

		const description = screen.getByText( 'description' );

		expect( trigger.textContent ).toBe( 'Added: Homepage + 2 pagesEdit pages' );
		expect( trigger.contains( description ) ).toBe( false );
		expect( description.closest( '[hidden]' ) ).toBeNull();
	} );

	it( 'keeps the editor and the upgrade CTA inside the collapsible', () => {
		render( <CornerstonePagesCard /> );
		const editor = screen.getByText( 'editor' );
		const cta = screen.getByText( 'upgrade' );

		expect( editor.closest( '[hidden]' ) ).not.toBeNull();
		expect( cta.closest( '[hidden]' ) ).toBe( editor.closest( '[hidden]' ) );

		fireEvent.click( screen.getByRole( 'button', { name: /Edit pages/ } ) );

		expect( editor.closest( '[hidden]' ) ).toBeNull();
	} );

	it( 'drops the pre-render row when speculation rules are unavailable', () => {
		mockSpeculationRules = { active: false, available: false };
		render( <CornerstonePagesCard /> );

		expect( screen.queryByText( 'prerender' ) ).toBeNull();
	} );

	it( 'records the editor toggle like the legacy panel', () => {
		const { recordBoostEvent } = jest.requireMock( '$lib/utils/analytics' );
		render( <CornerstonePagesCard /> );

		fireEvent.click( screen.getByRole( 'button', { name: /Edit pages/ } ) );

		expect( recordBoostEvent ).toHaveBeenCalledWith( 'cornerstone_pages_panel_toggle', {
			status: 'open',
		} );
	} );
} );
