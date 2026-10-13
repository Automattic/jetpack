import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useNavigate } from '@wordpress/route';
import VideoNav from '../index';

jest.mock( '@wordpress/route', () => ( {
	__esModule: true,
	useNavigate: jest.fn(),
} ) );

const mockUseNavigate = useNavigate as jest.Mock;

describe( 'VideoNav', () => {
	let navigate: jest.Mock;

	beforeEach( () => {
		jest.clearAllMocks();
		navigate = jest.fn();
		mockUseNavigate.mockReturnValue( navigate );
	} );

	it( 'renders the two per-video tabs', () => {
		render( <VideoNav videoId="42" activeTab="details" /> );

		expect( screen.getAllByRole( 'tab' ).map( tab => tab.textContent ) ).toEqual( [
			'Details',
			'Editor',
		] );
	} );

	it( 'navigates to the per-video paths on tab activation', async () => {
		const user = userEvent.setup();
		render( <VideoNav videoId="42" activeTab="details" /> );

		await user.click( screen.getByRole( 'tab', { name: 'Editor' } ) );
		expect( navigate ).toHaveBeenCalledWith( { href: '/video/42/editor' } );
	} );

	it( 'navigates back to the details path from another tab', async () => {
		const user = userEvent.setup();
		render( <VideoNav videoId="42" activeTab="editor" /> );

		await user.click( screen.getByRole( 'tab', { name: 'Details' } ) );
		expect( navigate ).toHaveBeenCalledWith( { href: '/video/42' } );
	} );

	it( 'consults confirmNavigation before leaving and honors a decline', async () => {
		const user = userEvent.setup();
		const confirmNavigation = jest.fn( () => false );
		render( <VideoNav videoId="42" activeTab="details" confirmNavigation={ confirmNavigation } /> );

		await user.click( screen.getByRole( 'tab', { name: 'Editor' } ) );
		expect( confirmNavigation ).toHaveBeenCalled();
		expect( navigate ).not.toHaveBeenCalled();

		confirmNavigation.mockReturnValue( true );
		await user.click( screen.getByRole( 'tab', { name: 'Editor' } ) );
		expect( navigate ).toHaveBeenCalledWith( { href: '/video/42/editor' } );
	} );
} );
