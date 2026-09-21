import { jest } from '@jest/globals';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import IconTooltip from '../index.tsx';
import { IconTooltipProps } from '../types.ts';

describe( 'IconTooltip', () => {
	const testProps: IconTooltipProps = {
		title: 'Title',
		children: <div>Content block</div>,
	};

	it.each( [ '{Enter}', ' ' ] )( 'opens with %s and dismisses with Escape', async key => {
		const user = userEvent.setup();
		const onClose = jest.fn();
		render( <IconTooltip { ...testProps } onClose={ onClose } /> );
		await user.tab();
		const trigger = screen.getByRole( 'button' );
		await user.keyboard( key );
		expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
		await user.keyboard( '{Escape}' );
		expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
		expect( trigger ).toHaveFocus();
		expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
		expect( onClose ).toHaveBeenCalledTimes( 1 );
	} );

	it( 'renders the icon tooltip', () => {
		render( <IconTooltip { ...testProps } /> );
		expect( screen.getByTestId( 'icon-tooltip_wrapper' ) ).toBeInTheDocument();
	} );
} );
