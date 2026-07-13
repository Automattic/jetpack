import { act, renderHook } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import useToggleSocialModule from '../use-toggle-social-module';

jest.mock( '@wordpress/data', () => ( { useSelect: jest.fn(), useDispatch: jest.fn() } ) );
jest.mock( '../../../social-store', () => ( { store: 'jetpack-social' } ) );

const mockUseSelect = useSelect as jest.Mock;
const mockUseDispatch = useDispatch as jest.Mock;

/**
 * Wire the store selectors + dispatch the hook reads.
 *
 * @param options           - Store state to simulate.
 * @param options.publicize - Whether the module is currently active.
 * @param options.isSaving  - Whether a settings save is in flight.
 * @return The dispatch spy the hook calls.
 */
function setup( { publicize, isSaving = false }: { publicize: boolean; isSaving?: boolean } ) {
	mockUseSelect.mockImplementation( ( map: ( select: unknown ) => unknown ) =>
		map( () => ( {
			getSocialModuleSettings: () => ( { publicize } ),
			isSavingSocialModuleSettings: () => isSaving,
		} ) )
	);

	const updateSocialModuleSettings = jest.fn().mockResolvedValue( undefined );
	mockUseDispatch.mockReturnValue( { updateSocialModuleSettings } );

	return { updateSocialModuleSettings };
}

describe( 'useToggleSocialModule', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'exposes the module state and saving flag', () => {
		setup( { publicize: true, isSaving: true } );

		const { result } = renderHook( () => useToggleSocialModule() );

		expect( result.current.isModuleActive ).toBe( true );
		expect( result.current.isUpdating ).toBe( true );
	} );

	it( 'inverts the current state for no-arg callers', async () => {
		const { updateSocialModuleSettings } = setup( { publicize: false } );

		const { result } = renderHook( () => useToggleSocialModule() );
		await act( async () => {
			await result.current.toggleModule();
		} );

		expect( updateSocialModuleSettings ).toHaveBeenCalledWith( { publicize: true } );
	} );

	it( 'prefers the target state passed by ToggleControl', async () => {
		const { updateSocialModuleSettings } = setup( { publicize: true } );

		const { result } = renderHook( () => useToggleSocialModule() );
		await act( async () => {
			await result.current.toggleModule( false );
		} );

		expect( updateSocialModuleSettings ).toHaveBeenCalledWith( { publicize: false } );
	} );
} );
