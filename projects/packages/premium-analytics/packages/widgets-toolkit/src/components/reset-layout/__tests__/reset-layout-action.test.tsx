import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { useViewportMatch } from '@wordpress/compose';
import { ResetLayoutAction } from '../reset-layout-action';

const ViewportWidth = useViewportMatch.__experimentalWidthProvider;

describe( 'ResetLayoutAction', () => {
	it( 'asks before resetting, and Cancel changes nothing', async () => {
		const user = userEvent.setup();
		const onReset = jest.fn();
		render( <ResetLayoutAction onReset={ onReset } /> );

		await user.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );
		const dialog = await screen.findByRole( 'alertdialog' );
		expect( dialog ).toBeVisible();

		await user.click( within( dialog ).getByRole( 'button', { name: 'Cancel' } ) );

		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
		expect( onReset ).not.toHaveBeenCalled();
	} );

	it( 'resets on confirmation and closes', async () => {
		const user = userEvent.setup();
		const onReset = jest.fn();
		render( <ResetLayoutAction onReset={ onReset } /> );

		await user.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );
		const dialog = await screen.findByRole( 'alertdialog' );

		await user.click( within( dialog ).getByRole( 'button', { name: 'Reset' } ) );

		expect( onReset ).toHaveBeenCalledTimes( 1 );
		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );
	} );

	it( 'keeps an open dialog when the header turns narrow', async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<ViewportWidth value={ 601 }>
				<ResetLayoutAction onReset={ () => {} } />
			</ViewportWidth>
		);

		await user.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );
		const dialog = await screen.findByRole( 'alertdialog' );

		rerender(
			<ViewportWidth value={ 599 }>
				<ResetLayoutAction onReset={ () => {} } />
			</ViewportWidth>
		);

		expect( screen.queryByRole( 'button', { name: 'Reset to default' } ) ).not.toBeInTheDocument();
		expect( dialog ).toBeVisible();
	} );

	it( 'does not reopen the dialog when the header turns wide again', async () => {
		const user = userEvent.setup();
		const { rerender } = render(
			<ViewportWidth value={ 601 }>
				<ResetLayoutAction onReset={ () => {} } />
			</ViewportWidth>
		);

		await user.click( screen.getByRole( 'button', { name: 'Reset to default' } ) );
		const dialog = await screen.findByRole( 'alertdialog' );
		await user.click( within( dialog ).getByRole( 'button', { name: 'Cancel' } ) );
		await waitFor( () => expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument() );

		rerender(
			<ViewportWidth value={ 599 }>
				<ResetLayoutAction onReset={ () => {} } />
			</ViewportWidth>
		);
		rerender(
			<ViewportWidth value={ 601 }>
				<ResetLayoutAction onReset={ () => {} } />
			</ViewportWidth>
		);

		expect( screen.queryByRole( 'alertdialog' ) ).not.toBeInTheDocument();
	} );

	// Not 600: the width provider treats it as wide, a real `max-width: 600px` query as narrow.
	it.each( [
		[ 'stands down on a narrow header, where the Stats options menu carries it', 599, false ],
		[ 'holds its place in the actions on a wide one', 601, true ],
	] )( '%s', ( _name, width, hasButton ) => {
		render(
			<ViewportWidth value={ width }>
				<ResetLayoutAction onReset={ () => {} } />
			</ViewportWidth>
		);

		expect( screen.queryByRole( 'button', { name: 'Reset to default' } ) !== null ).toBe(
			hasButton
		);
	} );
} );
