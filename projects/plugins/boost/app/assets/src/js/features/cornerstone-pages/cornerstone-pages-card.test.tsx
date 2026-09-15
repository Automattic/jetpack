/* No jest-dom or user-event in this project; a click is all the header needs. */
/* eslint-disable jest-dom/prefer-in-document, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import CornerstonePagesCard from './cornerstone-pages-card';

jest.mock( './cornerstone-pages', () => ( { useCornerstoneSummary: () => mockSummary } ) );
jest.mock( './meta/meta', () => ( {
	__esModule: true,
	default: () => <div>editor</div>,
	CornerstonePagesUpgradeCTA: () => <div>upgrade</div>,
} ) );
jest.mock( './prerender/prerender', () => () => <div>prerender</div> );
jest.mock( '$features/lcp/lcp', () => () => <div>lcp</div> );
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

	it( 'shows the summary on the editor header and the LCP row below it', () => {
		render( <CornerstonePagesCard /> );

		expect( screen.getByText( 'Added: Homepage + 2 pages' ) ).toBeTruthy();
		expect( screen.getByText( 'prerender' ) ).toBeTruthy();
		expect( screen.getByText( 'lcp' ) ).toBeTruthy();
	} );

	it( 'drops the pre-render row when speculation rules are unavailable', () => {
		mockSpeculationRules = { active: false, available: false };
		render( <CornerstonePagesCard /> );

		expect( screen.queryByText( 'prerender' ) ).toBeNull();
	} );

	it( 'records the editor toggle like the legacy panel', () => {
		const { recordBoostEvent } = jest.requireMock( '$lib/utils/analytics' );
		render( <CornerstonePagesCard /> );

		fireEvent.click( screen.getByRole( 'button', { name: /Edit cornerstone pages/ } ) );

		expect( recordBoostEvent ).toHaveBeenCalledWith( 'cornerstone_pages_panel_toggle', {
			status: 'open',
		} );
	} );
} );
