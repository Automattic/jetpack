import { render, renderHook } from '@testing-library/react';
import { useSelect, useDispatch } from '@wordpress/data';
import ConnectionManagement from '../components/connection-management';
import { ConnectionManagementPageObject } from '../components/connection-management/tests/pageObjects/ConnectionManagementPage';
import useSocialMediaConnections from '../hooks/use-social-media-connections';
import { store } from '../social-store';
import { SUPPORTED_SERVICES_MOCK } from './test-constants';

jest.mock( '../hooks/use-social-media-connections', () => ( {
	__esModule: true,
	default: jest.fn(),
} ) );

export const setup = ( {
	connections = [
		{ service_name: 'twitter', connection_id: '1', display_name: 'Twitter' },
		{
			service_name: 'facebook',
			connection_id: '2',
			display_name: 'Facebook',
		},
	],
	getDeletingConnections = [],
	getUpdatingConnections = [],
	canUserManageConnection = true,
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
	const stubGetKeyringResult = jest.spyOn( storeSelect, 'getKeyringResult' ).mockReset();
	jest
		.spyOn( storeSelect, 'canUserManageConnection' )
		.mockReset()
		.mockReturnValue( canUserManageConnection );

	const { result: dispatch } = renderHook( () => useDispatch( store ) );
	const stubDeleteConnectionById = jest
		.spyOn( dispatch.current, 'deleteConnectionById' )
		.mockReset();
	const stubUpdateConnectionById = jest
		.spyOn( dispatch.current, 'updateConnectionById' )
		.mockReset();
	const stubSetKeyringResult = jest.spyOn( dispatch.current, 'setKeyringResult' ).mockReset();
	const stubCreateConnection = jest.spyOn( dispatch.current, 'createConnection' ).mockReset();

	useSocialMediaConnections.mockReturnValue( {
		refresh: jest.fn(),
	} );

	global.JetpackScriptData = {
		...global.JetpackScriptData,
		social: {
			supported_services: SUPPORTED_SERVICES_MOCK,
		},
	};

	return {
		stubDeleteConnectionById,
		stubUpdateConnectionById,
		stubGetKeyringResult,
		stubSetKeyringResult,
		stubCreateConnection,
	};
};

export const getManagementPageObject = () => {
	return new ConnectionManagementPageObject( render( <ConnectionManagement /> ) );
};
