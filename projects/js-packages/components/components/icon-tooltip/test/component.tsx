import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import IconTooltip from '../index.tsx';
import { IconTooltipProps } from '../types.ts';

/**
 * Make elements measurable, since jsdom reports no layout and the tabbable helpers skip
 * anything that measures zero.
 *
 * @return Cleanup that restores the original getter.
 */
const withLayout = () => {
	const descriptor = Object.getOwnPropertyDescriptor( HTMLElement.prototype, 'offsetHeight' );
	Object.defineProperty( HTMLElement.prototype, 'offsetHeight', { configurable: true, value: 10 } );
	return () => {
		if ( descriptor ) {
			Object.defineProperty( HTMLElement.prototype, 'offsetHeight', descriptor );
		}
	};
};

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

	it.each( [ true, false ] )(
		'hands focus past the trigger on Tab out (inline: %s)',
		async inline => {
			const restoreLayout = withLayout();
			const user = userEvent.setup();
			render(
				<>
					<button>Before</button>
					<IconTooltip { ...testProps } inline={ inline } />
					<button>After</button>
				</>
			);
			await user.click( screen.getByRole( 'button', { name: 'Before' } ) );
			await user.tab();
			await user.keyboard( '{Enter}' );
			expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
			await user.tab();
			expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
			expect( screen.getByRole( 'button', { name: 'After' } ) ).toHaveFocus();
			restoreLayout();
		}
	);

	it( 'hands focus back before the trigger on Shift+Tab out', async () => {
		const restoreLayout = withLayout();
		const user = userEvent.setup();
		render(
			<>
				<button>Before</button>
				<IconTooltip { ...testProps } inline={ false } />
				<button>After</button>
			</>
		);
		await user.click( screen.getByRole( 'button', { name: 'Before' } ) );
		await user.tab();
		await user.keyboard( '{Enter}' );
		await user.tab( { shift: true } );
		expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'Before' } ) ).toHaveFocus();
		restoreLayout();
	} );

	it( 'renders the icon tooltip', () => {
		render( <IconTooltip { ...testProps } /> );
		expect( screen.getByTestId( 'icon-tooltip_wrapper' ) ).toBeInTheDocument();
	} );
} );
