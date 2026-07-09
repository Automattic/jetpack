import { act, renderHook } from '@testing-library/react';
import { useDispatch, useSelect } from '@wordpress/data';
import { getSocialScriptData } from '../../../utils';
import useToggleSocialModule from '../use-toggle-social-module';

jest.mock( '@wordpress/data', () => ( { useSelect: jest.fn(), useDispatch: jest.fn() } ) );
jest.mock( '../../../social-store', () => ( { store: 'jetpack-social' } ) );
jest.mock( '../../../utils', () => ( { getSocialScriptData: jest.fn() } ) );

const mockUseSelect = useSelect as jest.Mock;
const mockUseDispatch = useDispatch as jest.Mock;
const mockGetSocialScriptData = getSocialScriptData as jest.Mock;

/**
 * Wire the store selectors + dispatch the hook reads.
 *
 * @param options                    - Store state to simulate.
 * @param options.publicize          - Whether the module is currently active.
 * @param options.isSaving           - Whether a settings save is in flight.
 * @param options.isPublicizeEnabled - The `is_publicize_enabled` script-data flag (module state at page load).
 * @return The dispatch spy the hook calls.
 */
function setup( {
	publicize,
	isSaving = false,
	isPublicizeEnabled = publicize,
}: {
	publicize: boolean;
	isSaving?: boolean;
	isPublicizeEnabled?: boolean;
} ) {
	mockUseSelect.mockImplementation( ( map: ( select: unknown ) => unknown ) =>
		map( () => ( {
			getSocialModuleSettings: () => ( { publicize } ),
			isSavingSocialModuleSettings: () => isSaving,
		} ) )
	);
	mockGetSocialScriptData.mockReturnValue( { is_publicize_enabled: isPublicizeEnabled } );

	const updateSocialModuleSettings = jest.fn().mockResolvedValue( undefined );
	mockUseDispatch.mockReturnValue( { updateSocialModuleSettings } );

	return { updateSocialModuleSettings };
}

describe( 'useToggleSocialModule', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'enables the module (and reloads) when it was off at page load', async () => {
		// `isPublicizeEnabled: false` takes the reload branch. jsdom's
		// `window.location.reload` is a locked no-op, so we exercise the branch
		// without being able to spy on it.
		const { updateSocialModuleSettings } = setup( {
			publicize: false,
			isPublicizeEnabled: false,
		} );

		const { result } = renderHook( () => useToggleSocialModule() );
		await act( async () => {
			await result.current.toggleModule();
		} );

		expect( updateSocialModuleSettings ).toHaveBeenCalledWith( { publicize: true } );
	} );

	it( 'disables the module when it was on', async () => {
		const { updateSocialModuleSettings } = setup( { publicize: true } );

		const { result } = renderHook( () => useToggleSocialModule() );
		await act( async () => {
			await result.current.toggleModule();
		} );

		expect( updateSocialModuleSettings ).toHaveBeenCalledWith( { publicize: false } );
	} );
} );
