import { act, renderHook } from '@testing-library/react';
import useActivatePlugins from '../use-activate-plugins';

const mockCreateSuccessNotice = jest.fn();
const mockRecordEvent = jest.fn();
const mockRefetch = jest.fn( () => Promise.resolve() );
let mutationOptions: Record< string, unknown > = {};

jest.mock( '@automattic/jetpack-components', () => ( {
	useGlobalNotices: () => ( { createSuccessNotice: mockCreateSuccessNotice } ),
} ) );

jest.mock( '../../../hooks/use-analytics', () => () => ( { recordEvent: mockRecordEvent } ) );

jest.mock( '../use-products', () => () => ( {
	products: [
		{
			slug: 'jetpack-forms',
			name: 'Forms',
			title: 'Forms',
			isPluginActive: true,
			standalonePluginInfo: { hasStandalonePlugin: false },
		},
	],
	refetch: mockRefetch,
} ) );

jest.mock( '../../use-simple-mutation', () => ( {
	__esModule: true,
	default: options => {
		mutationOptions = options;
		return { mutate: jest.fn(), isPending: false, isSuccess: false };
	},
} ) );

jest.mock( '../../utils/get-my-jetpack-window-state', () => ( {
	getMyJetpackWindowInitialState: () => ( {
		items: {
			'jetpack-forms': {
				plugin_slug: 'jetpack',
				standalone_plugin_info: { has_standalone_plugin: false },
			},
		},
	} ),
} ) );

describe( 'useActivatePlugins', () => {
	beforeEach( () => {
		jest.clearAllMocks();
		mutationOptions = {};
	} );

	it( 'offers menu customization after a product activates', async () => {
		renderHook( () => useActivatePlugins( 'jetpack-forms' ) );

		await act( async () => {
			( mutationOptions.options as { onSuccess: () => void } ).onSuccess();
			await mockRefetch();
		} );

		expect( mockCreateSuccessNotice ).toHaveBeenCalledWith( 'Forms activated successfully!', {
			actions: [
				{
					label: 'Customize menu',
					url: 'admin.php?page=my-jetpack#/customize',
				},
			],
		} );
	} );
} );
