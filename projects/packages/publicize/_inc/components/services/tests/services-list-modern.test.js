import { render, renderHook, screen } from '@testing-library/react';
import { useSelect } from '@wordpress/data';
import { store } from '../../../social-store';
import { setup } from '../../../utils/test-factory';
import { ModernServicesList } from '../services-list-modern';

// Keep the list shallow — each row is covered by service-item-modern's own test.
jest.mock( '../service-item-modern', () => ( {
	ModernServiceItem: ( { service } ) => <div>Row: { service.label }</div>,
} ) );

const prepareStore = () => {
	setup();
	let storeSelect;
	renderHook( () => useSelect( select => ( storeSelect = select( store ) ) ) );
	jest.spyOn( storeSelect, 'getReconnectingAccount' ).mockReturnValue( undefined );
};

describe( 'ModernServicesList', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders a row for each supported service', () => {
		prepareStore();
		render( <ModernServicesList /> );

		// The shared factory seeds Facebook, LinkedIn and Instagram Business.
		expect( screen.getByText( 'Row: Facebook' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Row: LinkedIn' ) ).toBeInTheDocument();
		expect( screen.getByText( 'Row: Instagram Business' ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 3 );
	} );
} );
