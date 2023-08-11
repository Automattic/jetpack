import { renderHook, waitFor, act } from '@testing-library/react';
import { isSimpleSite } from '../../../site-type-utils';
import useModuleStatus from '../index';

jest.mock( '../../../site-type-utils' );

describe( 'useModuleStatus hook', () => {
	const originalFetch = window.fetch;

	beforeEach( () => {
		isSimpleSite.mockReset();
		// eslint-disable-next-line jest/prefer-spy-on -- Nothing to spy on.
		window.fetch = jest.fn();
	} );

	afterEach( () => {
		window.fetch = originalFetch;
	} );
	test( 'should not try to fetch modules if no name is provided', () => {
		const { result } = renderHook( name => useModuleStatus( name ), {
			initialProps: '',
		} );
		const { changeStatus, ...otherProps } = result.current;

		expect( otherProps ).toStrictEqual( {
			isLoadingModules: false,
			isChangingStatus: false,
			isModuleActive: false,
		} );
	} );

	test( 'jetpack module is active on not simple sites.', async () => {
		isSimpleSite.mockReturnValueOnce( false );

		window.fetch.mockReturnValueOnce(
			Promise.resolve( {
				status: 200,
				json: () =>
					Promise.resolve( {
						subscriptions: {
							activated: true,
						},
					} ),
			} )
		);

		const { result } = renderHook( name => useModuleStatus( name ), {
			initialProps: 'subscriptions',
		} );

		expect( result.current.isModuleActive ).toBe( false );
		await waitFor( async () => expect( result.current.isModuleActive ).toBe( true ) );

		expect( window.fetch ).toHaveBeenCalledWith(
			'/jetpack/v4/module/all?_locale=user',
			expect.anything()
		);

		const { changeStatus, ...otherProps } = result.current;

		expect( otherProps ).toStrictEqual( {
			isLoadingModules: false,
			isChangingStatus: false,
			isModuleActive: true,
		} );
	} );

	test( 'jetpack module is active on simple sites.', async () => {
		isSimpleSite.mockReturnValueOnce( true );

		window.fetch.mockReturnValueOnce(
			Promise.resolve( {
				status: 200,
				json: () =>
					Promise.resolve( {
						subscriptions: {
							activated: false,
						},
					} ),
			} )
		);

		const { result } = renderHook( name => useModuleStatus( name ), {
			initialProps: 'subscriptions',
		} );

		expect( result.current.isModuleActive ).toBe( false );
		await waitFor( async () => expect( result.current.isModuleActive ).toBe( true ) );
		expect( window.fetch ).not.toHaveBeenCalled();

		const { changeStatus, ...otherProps } = result.current;

		expect( otherProps ).toStrictEqual( {
			isLoadingModules: false,
			isChangingStatus: false,
			isModuleActive: true,
		} );
	} );

	test( 'change jetpack module status', async () => {
		isSimpleSite.mockReturnValueOnce( false );

		window.fetch.mockReturnValueOnce(
			Promise.resolve( {
				status: 200,
				json: () =>
					Promise.resolve( {
						subscriptions: {
							activated: true,
						},
					} ),
			} )
		);

		const { result } = renderHook( name => useModuleStatus( name ), {
			initialProps: 'subscriptions',
		} );

		await waitFor( async () => expect( result.current.isModuleActive ).toBe( true ) );
		expect( window.fetch ).toHaveBeenCalledWith(
			'/jetpack/v4/module/all?_locale=user',
			expect.anything()
		);
		window.fetch.mockReset();

		window.fetch.mockReturnValueOnce(
			Promise.resolve( {
				status: 200,
				json: () => Promise.resolve( {} ),
			} )
		);

		act( () => {
			result.current.changeStatus( false );
		} );

		expect( result.current.isChangingStatus ).toBe( true );
		expect( result.current.isModuleActive ).toBe( true );

		await waitFor( async () => expect( result.current.isChangingStatus ).toBe( false ) );
		expect( result.current.isModuleActive ).toBe( false );

		Promise.resolve( {
			status: 200,
			json: () => Promise.resolve( {} ),
		} );

		expect( window.fetch ).toHaveBeenCalledWith(
			'/jetpack/v4/module/subscriptions/active?_locale=user',
			expect.anything()
		);
	} );
} );
