import { render, renderHook, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { store } from '../../../social-store';
import { setup } from '../../../utils/test-factory';
import { DashboardServicesList } from '../services-list-dashboard';

// Keep the list shallow — each row is covered by service-item-dashboard's own test.
jest.mock( '../service-item-dashboard', () => ( {
	DashboardServiceItem: ( { service } ) => <div>Row: { service.label }</div>,
} ) );

const prepareStore = () => {
	setup();
	let storeSelect;
	renderHook( () => useSelect( select => ( storeSelect = select( store ) ) ) );
	jest.spyOn( storeSelect, 'getReconnectingAccount' ).mockReturnValue( undefined );
};

describe( 'DashboardServicesList', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders a row for each supported service', () => {
		prepareStore();
		render( <DashboardServicesList /> );

		// The shared factory seeds Facebook, LinkedIn and Instagram Business.
		expect( screen.getByText( 'Row: Facebook' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Row: LinkedIn' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Row: Instagram Business' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 3 );
	} );
} );
