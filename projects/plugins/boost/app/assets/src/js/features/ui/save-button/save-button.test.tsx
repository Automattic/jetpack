/* No jest-dom or user-event in this project. */
/* eslint-disable jest-dom/prefer-to-have-attribute, jest-dom/prefer-enabled-disabled, jest-dom/prefer-to-have-class, testing-library/prefer-user-event */
import { fireEvent, render, screen } from '@testing-library/react';
import { ModuleSurfaceProvider } from '$features/module/surface';
import SaveButton from './save-button';

it( 'renders the compact design-system button on a Settings row and ignores clicks while disabled', () => {
	const onClick = jest.fn();
	const { rerender } = render(
		<ModuleSurfaceProvider value="row">
			<SaveButton disabled onClick={ onClick } />
		</ModuleSurfaceProvider>
	);
	const save = screen.getByRole( 'button', { name: 'Save' } );
	expect( save.getAttribute( 'aria-disabled' ) ).toBe( 'true' );
	expect( save.className ).not.toContain( 'components-button' );
	fireEvent.click( save );
	expect( onClick ).not.toHaveBeenCalled();

	rerender(
		<ModuleSurfaceProvider value="row">
			<SaveButton disabled={ false } onClick={ onClick } />
		</ModuleSurfaceProvider>
	);
	fireEvent.click( screen.getByRole( 'button', { name: 'Save' } ) );
	expect( onClick ).toHaveBeenCalledTimes( 1 );
} );

it( 'keeps the legacy primary button outside a Settings row', () => {
	render( <SaveButton disabled onClick={ jest.fn() } /> );
	const save = screen.getByRole< HTMLButtonElement >( 'button', { name: 'Save' } );
	expect( save.disabled ).toBe( true );
	expect( save.className ).toContain( 'components-button' );
} );
