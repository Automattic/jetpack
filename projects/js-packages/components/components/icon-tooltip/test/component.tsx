import { jest } from '@jest/globals';
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

	describe( 'with a text trigger', () => {
		const triggerProps: IconTooltipProps = {
			...testProps,
			popoverAnchorStyle: 'wrapper',
			trigger: 'See an example',
		};

		it( 'toggles on clicks and reports each one', async () => {
			const user = userEvent.setup();
			const onTriggerClick = jest.fn();
			render( <IconTooltip { ...triggerProps } onTriggerClick={ onTriggerClick } /> );
			const trigger = screen.getByRole( 'button', { name: 'See an example' } );
			await user.click( trigger );
			expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
			expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
			await user.click( trigger );
			expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
			expect( onTriggerClick ).toHaveBeenCalledTimes( 2 );
		} );

		it.each( [ true, false ] )(
			'closes with Escape and refocuses the trigger (inline: %s)',
			async inline => {
				const user = userEvent.setup();
				render( <IconTooltip { ...triggerProps } inline={ inline } /> );
				const trigger = screen.getByRole( 'button', { name: 'See an example' } );
				await user.tab();
				await user.keyboard( '{Enter}' );
				expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
				expect( trigger ).toHaveFocus();
				await user.keyboard( '{Escape}' );
				expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
				expect( trigger ).toHaveFocus();
				expect( trigger ).toHaveAttribute( 'aria-expanded', 'false' );
			}
		);

		it( 'focuses a portaled popover link, tabs back and forth, and closes with Escape from inside', async () => {
			const restoreLayout = withLayout();
			const user = userEvent.setup();
			render(
				<IconTooltip { ...triggerProps } inline={ false }>
					<a href="#learn">Learn more</a>
				</IconTooltip>
			);
			const trigger = screen.getByRole( 'button', { name: 'See an example' } );
			await user.tab();
			await user.keyboard( '{Enter}' );
			expect( screen.getByRole( 'link', { name: 'Learn more' } ) ).toHaveFocus();
			await user.tab( { shift: true } );
			expect( trigger ).toHaveFocus();
			expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
			await user.tab();
			expect( screen.getByRole( 'link', { name: 'Learn more' } ) ).toHaveFocus();
			await user.keyboard( '{Escape}' );
			expect( screen.queryByRole( 'link', { name: 'Learn more' } ) ).not.toBeInTheDocument();
			expect( trigger ).toHaveFocus();
			restoreLayout();
		} );

		it( 'toggles once per Space press', async () => {
			const user = userEvent.setup();
			render( <IconTooltip { ...triggerProps } /> );
			const trigger = screen.getByRole( 'button', { name: 'See an example' } );
			await user.tab();
			await user.keyboard( ' ' );
			expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
			expect( trigger ).toHaveAttribute( 'aria-expanded', 'true' );
		} );

		it( 'stays open while the trigger is held and closes on release', async () => {
			const user = userEvent.setup();
			render( <IconTooltip { ...triggerProps } inline={ false } /> );
			const trigger = screen.getByRole( 'button', { name: 'See an example' } );
			await user.click( trigger );
			await user.pointer( { keys: '[MouseLeft>]', target: trigger } );
			expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
			await user.pointer( { keys: '[/MouseLeft]', target: trigger } );
			expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'renders the icon tooltip', () => {
		render( <IconTooltip { ...testProps } /> );
		expect( screen.getByTestId( 'icon-tooltip_wrapper' ) ).toBeInTheDocument();
	} );
} );
