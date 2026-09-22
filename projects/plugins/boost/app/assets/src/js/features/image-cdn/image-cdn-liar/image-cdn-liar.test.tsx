/* eslint-disable jest-dom/prefer-in-document -- This Jest project does not load jest-dom. */
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

test( 'keeps the unlabelled toggle and h4 heading on the default legacy surface', () => {
	jest
		.mocked( useModulesState )
		.mockReturnValue( [
			{ data: { image_cdn_liar: { active: false, available: true } } },
			{ mutate: jest.fn() },
		] as unknown as ReturnType< typeof useModulesState > );
	render( <ImageCdnLiar isPremium /> );

	expect( screen.getByRole( 'checkbox', { name: '' } ) ).toBeTruthy();
	expect(
		screen.getByRole( 'heading', { name: 'Auto-Resize Lazy Images', level: 4 } )
	).toBeTruthy();
} );
