import { select } from '@wordpress/data';
import { isSimpleSite } from '../../site-type-utils';
import {
	updateJetpackModuleStatus,
	fetchModules,
	SET_JETPACK_MODULES,
	SET_MODULE_UPDATING,
	setJetpackModules,
} from '../actions';
import {
	fetchJetpackModules,
	updateJetpackModuleStatus as updateJetpackModuleStatusControl,
} from '../controls';

jest.mock( '@wordpress/data', () => ( {
	select: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

jest.mock( '../../site-type-utils', () => ( {
	isSimpleSite: jest.fn(),
} ) );

jest.mock( '../controls', () => ( {
	fetchJetpackModules: jest.fn(),
	updateJetpackModuleStatus: jest.fn(),
} ) );

const originalData = {
	data: {
		'test-module': {
			activated: false,
		},
	},
};

const settings = {
	name: 'test-module',
	activated: true,
};

const newData = {
	data: {
		'test-module': {
			activated: true,
		},
	},
};

describe( 'updateJetpackModuleStatus', () => {
	beforeEach( () => {
		select.mockReset();
		fetchJetpackModules.mockReset();
		updateJetpackModuleStatusControl.mockReset();
	} );

	test( 'should update module status and fetch modules', async () => {
		select.mockReturnValueOnce( {
			getJetpackModules: jest.fn().mockReturnValueOnce( originalData ),
		} );

		fetchJetpackModules.mockResolvedValueOnce( newData );

		const generator = updateJetpackModuleStatus( settings );

		// Set module as updating
		expect( generator.next().value ).toEqual( {
			type: SET_MODULE_UPDATING,
			name: 'test-module',
			isUpdating: true,
		} );

		// Updating module on server with new settings
		expect( generator.next().value ).toEqual( updateJetpackModuleStatusControl( settings ) );

		// Get modules data (from server)
		await expect( generator.next().value ).resolves.toEqual( newData );

		expect( fetchJetpackModules ).toHaveBeenCalledTimes( 1 );

		// Set modules data (from server)
		expect( generator.next( newData.data ).value ).toEqual( {
			type: SET_JETPACK_MODULES,
			options: newData,
		} );

		// Set module as not updating
		expect( generator.next().value ).toEqual( {
			type: SET_MODULE_UPDATING,
			name: 'test-module',
			isUpdating: false,
		} );

		expect( generator.next().value ).toBe( true );

		expect( generator.next().done ).toBe( true );
	} );

	test( 'should handle error and revert to old settings', async () => {
		select.mockReturnValueOnce( {
			getJetpackModules: jest.fn().mockReturnValueOnce( originalData ),
		} );

		fetchJetpackModules.mockImplementation( () => {
			throw new Error( 'Fetch error' );
		} );

		const generator = updateJetpackModuleStatus( settings );

		// Set module as updating
		expect( generator.next().value ).toEqual( {
			type: SET_MODULE_UPDATING,
			name: 'test-module',
			isUpdating: true,
		} );

		// Updating module with new settings
		expect( generator.next().value ).toEqual( updateJetpackModuleStatusControl( settings ) );

		// After error fallback to old settings
		expect( generator.next().value ).toEqual( {
			type: SET_JETPACK_MODULES,
			options: originalData,
		} );

		// Set module as not updating
		expect( generator.next().value ).toEqual( {
			type: SET_MODULE_UPDATING,
			name: 'test-module',
			isUpdating: false,
		} );

		expect( generator.next().value ).toBe( false );

		expect( generator.next().done ).toBe( true );
	} );
} );

describe( 'fetchModules', () => {
	beforeEach( () => {
		select.mockReset();
		isSimpleSite.mockReset();
		fetchJetpackModules.mockReset();
	} );

	test( 'for simple site should return true', () => {
		isSimpleSite.mockReturnValueOnce( true );
		const generator = fetchModules();
		expect( generator.next().value ).toBe( true );
		expect( generator.next().done ).toBe( true );
	} );

	test( 'should fetch modules', async () => {
		isSimpleSite.mockReturnValueOnce( false );

		select.mockReturnValueOnce( {
			getJetpackModules: jest.fn().mockReturnValueOnce( newData ),
		} );

		fetchJetpackModules.mockResolvedValueOnce( newData );

		const generator = fetchModules();

		// Modules are set as loading
		expect( generator.next().value ).toEqual( {
			type: SET_JETPACK_MODULES,
			options: { isLoading: true },
		} );

		// Get modules data (from server)
		await expect( generator.next().value ).resolves.toEqual( newData );

		// Set modules data (from server)
		expect( generator.next( newData.data ).value ).toEqual( {
			type: SET_JETPACK_MODULES,
			options: newData,
		} );

		// Modules are set as not loading
		expect( generator.next().value ).toEqual( {
			type: SET_JETPACK_MODULES,
			options: { isLoading: false },
		} );

		expect( generator.next().value ).toBe( true );

		expect( generator.next().done ).toBe( true );
	} );

	test( 'should handle error and revert to old settings', () => {
		isSimpleSite.mockReturnValueOnce( false );

		select.mockReturnValueOnce( {
			getJetpackModules: jest.fn().mockReturnValueOnce( originalData ),
		} );

		fetchJetpackModules.mockImplementation( () => {
			throw new Error( 'Fetch error' );
		} );

		const generator = fetchModules();

		// Modules are set as loading
		expect( generator.next().value ).toEqual( {
			type: SET_JETPACK_MODULES,
			options: { isLoading: true },
		} );

		// After error fallback to old settings
		expect( generator.next().value ).toEqual( {
			type: SET_JETPACK_MODULES,
			options: originalData,
		} );

		// Modules are set as not loading
		expect( generator.next().value ).toEqual( {
			type: SET_JETPACK_MODULES,
			options: { isLoading: false },
		} );

		expect( generator.next().value ).toBe( false );

		expect( generator.next().done ).toBe( true );
	} );
} );

describe( 'setJetpackModules', () => {
	test( 'should create an action to set Jetpack modules', () => {
		const options = {
			data: {
				'test-module': {
					activated: true,
				},
			},
			isLoading: false,
		};

		const expectedAction = {
			type: SET_JETPACK_MODULES,
			options,
		};

		expect( setJetpackModules( options ) ).toEqual( expectedAction );
	} );
} );
