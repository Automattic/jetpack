import { render, renderHook, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useSelect } from '@wordpress/data';
import { SelectPlatform } from '..';
import { store } from '../../../../social-store';
import { setup } from '../../../../utils/test-factory';

// The step is body-only; the connection-flow modal owns the Dialog chrome.
const renderStep = () => render( <SelectPlatform /> );

const getStoreSelect = () => {
	let storeSelect;
	renderHook( () => useSelect( select => ( storeSelect = select( store ) ) ) );
	return storeSelect;
};

describe( 'SelectPlatform', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	test( 'renders a card for each supported service', () => {
		setup();
		renderStep();

		// The shared factory seeds Facebook, LinkedIn and Instagram Business.
		expect( screen.getByRole( 'button', { name: /Facebook/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /LinkedIn/ } ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: /Instagram/ } ) ).toBeInTheDocument();
		expect( screen.getAllByRole( 'listitem' ) ).toHaveLength( 3 );
		// The account-type descriptor is rendered alongside the platform name.
		expect( screen.getByText( 'Page' ) ).toBeInTheDocument();
	} );

	test( 'selecting a service with custom inputs advances to platform-input', async () => {
		const user = userEvent.setup();
		setup();
		const storeSelect = getStoreSelect();
		jest
			.spyOn( storeSelect, 'getServicesList' )
			.mockReturnValue( [ { id: 'bluesky', label: 'Bluesky', status: 'ok' } ] );

		renderStep();
		await user.click( screen.getByRole( 'button', { name: /Bluesky/ } ) );

		expect( storeSelect.getConnectionFlowSelectedServiceId() ).toBe( 'bluesky' );
		expect( storeSelect.getConnectionFlowStep() ).toBe( 'platform-input' );
	} );

	test( 'selecting a regular service advances straight to authorizing', async () => {
		const user = userEvent.setup();
		setup();
		const storeSelect = getStoreSelect();
		jest
			.spyOn( storeSelect, 'getServicesList' )
			.mockReturnValue( [ { id: 'facebook', label: 'Facebook', status: 'ok' } ] );

		renderStep();
		await user.click( screen.getByRole( 'button', { name: /Facebook/ } ) );

		expect( storeSelect.getConnectionFlowSelectedServiceId() ).toBe( 'facebook' );
		expect( storeSelect.getConnectionFlowStep() ).toBe( 'authorizing' );
	} );
} );
