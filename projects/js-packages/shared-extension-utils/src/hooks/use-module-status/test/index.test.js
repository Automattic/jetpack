import { renderHook, act } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import { isSimpleSite } from '../../../site-type-utils';
import useModuleStatus from '../index';

jest.mock( '../../../site-type-utils', () => ( {
	isSimpleSite: jest.fn(),
} ) );

jest.mock( '@wordpress/data', () => ( {
	useSelect: jest.fn(),
	useDispatch: jest.fn(),
	createReduxStore: jest.fn(),
	register: jest.fn(),
} ) );

describe( 'useModuleStatus hook', () => {
	const moduleName = 'test-module';
	beforeEach( () => {
		isSimpleSite.mockReset();
		useSelect.mockReset();
		useDispatch.mockReset();
	} );

	it( 'should return initial values', () => {
		useSelect.mockReturnValue( {
			isModuleActive: jest.fn().mockReturnValue( false ),
			isChangingStatus: jest.fn().mockReturnValue( false ),
			isLoadingModules: jest.fn().mockReturnValue( true ),
		} );
		useDispatch.mockReturnValue( {
			updateJetpackModuleStatus: jest.fn(),
		} );

		const { result } = renderHook( () => useModuleStatus( moduleName ) );
		const { isLoadingModules, isChangingStatus, isModuleActive } = result.current;

		expect( isLoadingModules( moduleName ) ).toBe( true );
		expect( isChangingStatus( moduleName ) ).toBe( false );
		expect( isModuleActive( moduleName ) ).toBe( false );
	} );

	it( 'should call updateJetpackModuleStatus when changeStatus is called', () => {
		useSelect.mockReturnValue( {
			isModuleActive: jest.fn(),
			isChangingStatus: jest.fn(),
			isLoadingModules: jest.fn(),
		} );
		const mockUpdateJetpackModuleStatus = jest.fn();
		useDispatch.mockReturnValue( {
			updateJetpackModuleStatus: mockUpdateJetpackModuleStatus,
		} );

		const { result } = renderHook( () => useModuleStatus( moduleName ) );

		act( () => {
			result.current.changeStatus( true );
		} );

		expect( mockUpdateJetpackModuleStatus ).toHaveBeenCalledWith( {
			name: moduleName,
			active: true,
		} );
	} );
} );
