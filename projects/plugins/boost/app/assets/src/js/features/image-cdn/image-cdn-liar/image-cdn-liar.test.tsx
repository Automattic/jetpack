import { fireEvent, render, screen } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import { useModulesState } from '$features/module/lib/stores';
import ImageCdnLiar from './image-cdn-liar';

jest.mock( '$features/module/lib/stores', () => ( { useModulesState: jest.fn() } ) );
jest.mock( '$features/ui/mutation-notice/mutation-notice', () => ( {
	useMutationNotice: jest.fn(),
} ) );
jest.mock( '$lib/utils/analytics', () => ( { recordBoostEvent: jest.fn() } ) );

test( 'names the modern auto-resize toggle and saves its value', () => {
	const mutate = jest.fn();
	jest
		.mocked( useModulesState )
		.mockReturnValue( [
			{ data: { image_cdn_liar: { active: false, available: true } } },
			{ mutate },
		] as unknown as ReturnType< typeof useModulesState > );
	render(
		<ModuleSurfaceProvider value="row">
			<ImageCdnLiar isPremium />
		</ModuleSurfaceProvider>
	);

	const toggle = screen.getByRole( 'checkbox', { name: 'Auto-Resize Lazy Images' } );
	// eslint-disable-next-line testing-library/prefer-user-event -- Match the synchronous control tests in this project.
	fireEvent.click( toggle );
	expect( mutate ).toHaveBeenCalledWith( {
		image_cdn_liar: { active: true, available: true },
	} );
} );
