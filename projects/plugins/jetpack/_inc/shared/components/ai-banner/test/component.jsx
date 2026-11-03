import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AiBanner from '../index';

const noop = () => {};

describe( 'AiBanner', () => {
	test( 'renders title, description, and actions', () => {
		render(
			<AiBanner
				title="Banner title"
				description="Banner description"
				actions={ <button type="button">Do it</button> }
				onDismiss={ noop }
			/>
		);

		expect( screen.getByRole( 'heading', { name: 'Banner title' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Banner description' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Do it' } ) ).toBeInTheDocument();
	} );

	test( 'renders only the close X when no actions are given', () => {
		render( <AiBanner title="Banner title" description="Banner description" onDismiss={ noop } /> );

		expect( screen.getAllByRole( 'button' ) ).toHaveLength( 1 );
		expect( screen.getByRole( 'button', { name: 'Dismiss banner' } ) ).toBeInTheDocument();
	} );

	test( 'close X calls onDismiss and takes a custom label', async () => {
		const onDismiss = jest.fn();
		render(
			<AiBanner
				title="Banner title"
				description="Banner description"
				onDismiss={ onDismiss }
				dismissLabel="Hide this"
			/>
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Hide this' } ) );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );
