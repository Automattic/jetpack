import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import IconTooltip from '../index.tsx';
import { IconTooltipProps } from '../types.ts';

describe( 'IconTooltip', () => {
	const testProps: IconTooltipProps = {
		title: 'Title',
		children: <div>Content block</div>,
	};

	it.each( [ '{Enter}', ' ' ] )( 'opens with %s and closes with Escape', async key => {
		const user = userEvent.setup();
		render( <IconTooltip { ...testProps } /> );
		const trigger = screen.getByRole( 'button' );
		await user.tab();
		await user.keyboard( key );
		expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
		await user.keyboard( '{Escape}' );
		expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
		expect( trigger ).toHaveFocus();
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
	} );

	it( 'toggles on pointer clicks', async () => {
		const user = userEvent.setup();
		render( <IconTooltip { ...testProps } /> );
		const trigger = screen.getByRole( 'button' );
		await user.click( trigger );
		expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
		await user.click( trigger );
		expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
	} );

	it( 'leaves focus alone when opening on hover', async () => {
		const user = userEvent.setup();
		render(
			<>
				<input aria-label="Field" />
				<IconTooltip { ...testProps } hoverShow />
			</>
		);
		const field = screen.getByRole( 'textbox' );
		await user.click( field );
		await user.hover( screen.getByTestId( 'icon-tooltip_wrapper' ) );
		expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
		expect( field ).toHaveFocus();
	} );

	it( 'renders the icon tooltip', () => {
		render( <IconTooltip { ...testProps } /> );
		expect( screen.getByTestId( 'icon-tooltip_wrapper' ) ).toBeInTheDocument();
	} );
} );
