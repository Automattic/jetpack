import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import HighlightBanner from '../index.tsx';

describe( 'HighlightBanner', () => {
	test( 'renders the title, description and actions', () => {
		render(
			<HighlightBanner
				title="Banner title"
				description="Banner description"
				actions={ <button type="button">Do it</button> }
			/>
		);

		expect( screen.getByRole( 'heading', { name: 'Banner title' } ) ).toBeInTheDocument();
		expect( screen.getByText( 'Banner description' ) ).toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Do it' } ) ).toBeInTheDocument();
	} );

	test( 'has no close button without onDismiss', () => {
		render( <HighlightBanner title="Banner title" /> );

		expect( screen.queryByRole( 'button' ) ).not.toBeInTheDocument();
	} );

	test( 'close button calls onDismiss and takes a custom label', async () => {
		const onDismiss = jest.fn();
		render(
			<HighlightBanner title="Banner title" onDismiss={ onDismiss } dismissLabel="Hide this" />
		);

		await userEvent.click( screen.getByRole( 'button', { name: 'Hide this' } ) );
		expect( onDismiss ).toHaveBeenCalledTimes( 1 );
	} );
} );
