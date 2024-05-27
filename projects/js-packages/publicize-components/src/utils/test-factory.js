import { render, renderHook } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';
import ConnectionManagement from '../components/connection-management';
import { ConnectionManagementPageObject } from '../components/connection-management/tests/pageObjects/ConnectionManagementPage';
import { useSupportedServices } from '../components/services/use-supported-services';
import useSocialMediaConnections from '../hooks/use-social-media-connections';
import { store } from '../social-store';

jest.mock( '../hooks/use-social-media-connections', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

jest.mock( '../components/services/use-supported-services', () => ( {
	useSupportedServices: jest.fn(),
} ) );

export const setup = ( {
	connections = [
		{ service_name: 'twitter', connection_id: '1', display_name: 'Twitter', can_disconnect: true },
		{
			service_name: 'facebook',
			connection_id: '2',
			display_name: 'Facebook',
			can_disconnect: true,
		},
	],
	getDeletingConnections = [],
	getUpdatingConnections = [],
} = {} ) => {
	let storeSelect;
	renderHook( () => useSelect( select => ( storeSelect = select( store ) ) ) );
	jest.spyOn( storeSelect, 'getConnections' ).mockReset().mockReturnValue( connections );
	jest
		.spyOn( storeSelect, 'getDeletingConnections' )
		.mockReset()
		.mockReturnValue( getDeletingConnections );
	jest
		.spyOn( storeSelect, 'getUpdatingConnections' )
		.mockReset()
		.mockReturnValue( getUpdatingConnections );

	const { result: dispatch } = renderHook( () => useDispatch( store ) );
	const stubDeleteConnectionById = jest
		.spyOn( dispatch.current, 'deleteConnectionById' )
		.mockReset()
		.mockReturnValue();
	const stubUpdateConnectionById = jest
		.spyOn( dispatch.current, 'updateConnectionById' )
		.mockReset()
		.mockReturnValue();

	useSocialMediaConnections.mockReturnValue( {
		refresh: jest.fn(),
	} );

	useSupportedServices.mockReturnValue( [
		{ ID: 'twitter', name: 'Twitter' },
		{ ID: 'facebook', name: 'Facebook' },
	] );

	return {
		stubDeleteConnectionById,
		stubUpdateConnectionById,
	};
};

export const getManagementPageObject = () => {
	return new ConnectionManagementPageObject( render( <ConnectionManagement /> ) );
};
