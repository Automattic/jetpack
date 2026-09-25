import { render, screen } from '@testing-library/react';
import IDCModal from '../index';

describe( 'IDCModal', () => {
	afterEach( () => {
		delete window.JP_IDENTITY_CRISIS__INITIAL_STATE;
	} );

	it( 'renders nothing when there is no IDC initial state', () => {
		render( <IDCModal /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing when the initial state has no containerID', () => {
		window.JP_IDENTITY_CRISIS__INITIAL_STATE = { containerID: null, isSafeModeConfirmed: false };
		render( <IDCModal /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'renders nothing when safe mode is already confirmed', () => {
		window.JP_IDENTITY_CRISIS__INITIAL_STATE = {
			containerID: 'test-idc-container',
			isSafeModeConfirmed: true,
		};
		render( <IDCModal /> );
		expect( screen.queryByRole( 'dialog' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the container with the given ID when IDC state calls for it', () => {
		window.JP_IDENTITY_CRISIS__INITIAL_STATE = {
			containerID: 'test-idc-container',
			isSafeModeConfirmed: false,
		};
		render( <IDCModal /> );
		expect( screen.getByTestId( 'jp-idc-modal-container' ) ).toHaveAttribute(
			'id',
			'test-idc-container'
		);
	} );
} );
