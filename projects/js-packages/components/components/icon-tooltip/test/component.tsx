import { jest } from '@jest/globals';
import { act, configure, render, screen, waitFor } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import IconTooltip from '../index.tsx';
import { IconTooltipProps } from '../types.ts';

// speak() copies tooltip text into `@wordpress/a11y`'s live region; match the tooltip only.
configure( { defaultIgnore: 'script, style, #a11y-speak-polite' } );

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

/**
 * WordPress's shared polite live region, where speak() announces.
 *
 * @return The region, or null before `@wordpress/a11y` has set it up.
 */
// eslint-disable-next-line testing-library/no-node-access
const politeRegion = () => document.getElementById( 'a11y-speak-polite' );

describe( 'IconTooltip', () => {
	afterEach( () => jest.useRealTimers() );

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

	it( 'names the icon trigger with label', () => {
		render( <IconTooltip { ...testProps } label="About Image Quality" /> );
		expect( screen.getByRole( 'button', { name: 'About Image Quality' } ) ).toBeInTheDocument();
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

		it( 'keeps focus on the trigger, tabs into a portaled popover and back, and closes with Escape from inside', async () => {
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
			expect( trigger ).toHaveFocus();
			await user.tab();
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

		it.each( [ true, false ] )(
			'closes on a press outside, wherever focus is (link inside: %s)',
			async withLink => {
				const restoreLayout = withLayout();
				const user = userEvent.setup();
				render(
					<>
						<IconTooltip { ...triggerProps }>
							{ withLink ? <a href="#learn">Learn more</a> : 'Content block' }
						</IconTooltip>
						<p>Elsewhere</p>
					</>
				);
				await user.click( screen.getByRole( 'button', { name: 'See an example' } ) );
				expect( screen.getByRole( 'button', { name: 'See an example' } ) ).toHaveAttribute(
					'aria-expanded',
					'true'
				);
				await user.click( screen.getByText( 'Elsewhere' ) );
				expect( screen.getByRole( 'button', { name: 'See an example' } ) ).toHaveAttribute(
					'aria-expanded',
					'false'
				);
				restoreLayout();
			}
		);

		it( 'stays open on a press outside when closeOnClickOutside is off', async () => {
			const restoreLayout = withLayout();
			const user = userEvent.setup();
			render(
				<>
					<IconTooltip { ...triggerProps } closeOnClickOutside={ false }>
						<a href="#learn">Learn more</a>
					</IconTooltip>
					<input aria-label="Exceptions" />
				</>
			);
			await user.click( screen.getByRole( 'button', { name: 'See an example' } ) );
			await user.click( screen.getByRole( 'textbox', { name: 'Exceptions' } ) );
			expect( screen.getByRole( 'link', { name: 'Learn more' } ) ).toBeInTheDocument();
			expect( screen.getByRole( 'textbox', { name: 'Exceptions' } ) ).toHaveFocus();
			restoreLayout();
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

	it( 'keeps focus on the icon when a tooltip with a link opens, and announces it', async () => {
		const restoreLayout = withLayout();
		const user = userEvent.setup();
		render(
			<IconTooltip title="Title">
				<a href="#learn">Learn more</a>
			</IconTooltip>
		);
		const trigger = screen.getByRole( 'button' );
		await user.tab();
		await user.keyboard( '{Enter}' );
		expect( trigger ).toHaveFocus();
		expect( politeRegion() ).toHaveTextContent( 'Learn more' );
		await user.tab();
		expect( screen.getByRole( 'link', { name: 'Learn more' } ) ).toHaveFocus();
		await user.keyboard( '{Escape}' );
		expect( trigger ).toHaveFocus();
		restoreLayout();
	} );

	it( 'does not announce a tooltip opened on hover', async () => {
		const user = userEvent.setup();
		politeRegion()?.replaceChildren();
		render( <IconTooltip { ...testProps } hoverShow /> );
		await user.hover( screen.getByTestId( 'icon-tooltip_wrapper' ) );
		expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
		expect( politeRegion() ).not.toHaveTextContent( 'Content block' );
	} );

	it( 'tabs through the popover links and on to the next control', async () => {
		const restoreLayout = withLayout();
		const user = userEvent.setup();
		render(
			<>
				<button>Before</button>
				<IconTooltip title="Title" inline={ false }>
					<a href="#one">One</a> <a href="#two">Two</a>
				</IconTooltip>
				<button>After</button>
			</>
		);
		await user.click( screen.getByRole( 'button', { name: 'Before' } ) );
		await user.tab();
		await user.keyboard( '{Enter}' );
		await user.tab();
		expect( screen.getByRole( 'link', { name: 'One' } ) ).toHaveFocus();
		await user.tab();
		expect( screen.getByRole( 'link', { name: 'Two' } ) ).toHaveFocus();
		await user.tab();
		expect( screen.queryByRole( 'link', { name: 'Two' } ) ).not.toBeInTheDocument();
		expect( screen.getByRole( 'button', { name: 'After' } ) ).toHaveFocus();
		restoreLayout();
	} );

	it( 'closes when focus leaves the popover some other way', async () => {
		const restoreLayout = withLayout();
		const user = userEvent.setup();
		render(
			<>
				<IconTooltip title="Title">
					<a href="#learn">Learn more</a>
				</IconTooltip>
				<input aria-label="Elsewhere" />
			</>
		);
		await user.tab();
		await user.keyboard( '{Enter}' );
		await user.tab();
		expect( screen.getByRole( 'link', { name: 'Learn more' } ) ).toHaveFocus();
		act( () => screen.getByRole( 'textbox', { name: 'Elsewhere' } ).focus() );
		await waitFor( () =>
			expect( screen.queryByRole( 'link', { name: 'Learn more' } ) ).not.toBeInTheDocument()
		);
		restoreLayout();
	} );

	it( 'closes a hover tooltip shortly after the pointer leaves, unless it comes back', async () => {
		jest.useFakeTimers();
		const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
		render( <IconTooltip { ...testProps } hoverShow /> );
		const wrapper = screen.getByTestId( 'icon-tooltip_wrapper' );
		await user.hover( wrapper );
		await user.unhover( wrapper );
		await user.hover( wrapper );
		await act( () => jest.advanceTimersByTimeAsync( 150 ) );
		expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
		await user.unhover( wrapper );
		await act( () => jest.advanceTimersByTimeAsync( 150 ) );
		expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
	} );

	it( 'renders the icon tooltip', () => {
		render( <IconTooltip { ...testProps } /> );
		expect( screen.getByTestId( 'icon-tooltip_wrapper' ) ).toBeInTheDocument();
	} );
} );
