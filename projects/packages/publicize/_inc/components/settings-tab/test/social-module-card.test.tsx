import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SocialModuleCard from '../social-module-card';
import useToggleSocialModule from '../use-toggle-social-module';

// Stub the toggle hook so this suite isolates the card's rendering + wiring
// (and keeps the hook's store/script-data imports out of the module graph).
jest.mock( '../use-toggle-social-module', () => ( { __esModule: true, default: jest.fn() } ) );

const mockUseToggleSocialModule = useToggleSocialModule as jest.Mock;

describe( 'SocialModuleCard', () => {
	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'reflects the active module state and toggles on change', async () => {
		const toggleModule = jest.fn();
		mockUseToggleSocialModule.mockReturnValue( {
			isModuleActive: true,
			isUpdating: false,
			toggleModule,
		} );

		render( <SocialModuleCard /> );

		const toggle = screen.getByRole( 'checkbox' );
		expect( toggle ).toBeChecked();

		await userEvent.click( toggle );
		expect( toggleModule ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'disables the toggle while updating', () => {
		mockUseToggleSocialModule.mockReturnValue( {
			isModuleActive: false,
			isUpdating: true,
			toggleModule: jest.fn(),
		} );

		render( <SocialModuleCard /> );

		const toggle = screen.getByRole( 'checkbox' );
		expect( toggle ).not.toBeChecked();
		expect( toggle ).toBeDisabled();
	} );
} );
