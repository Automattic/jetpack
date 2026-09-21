import { jest } from '@jest/globals';
import { act, render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';
import { useCallback, useRef, useState } from 'react';
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

	it.each( [ true, false ] )(
		'preserves controlled mouse and keyboard dismissal with inline=%s',
		async inline => {
			jest.useFakeTimers();
			const user = userEvent.setup( { advanceTimers: jest.advanceTimersByTime } );
			const onClose = jest.fn();
			const ControlledTooltip = () => {
				const [ show, setShow ] = useState( false );
				const triggerRef = useRef< HTMLButtonElement >( null );
				const toggleTooltip = useCallback( () => setShow( value => ! value ), [] );
				const closeTooltip = useCallback( () => {
					onClose();
					setShow( false );
				}, [] );
				return (
					<>
						<button ref={ triggerRef } onClick={ toggleTooltip }>
							Toggle
						</button>
						<IconTooltip
							{ ...testProps }
							popoverAnchorStyle="wrapper"
							forceShow={ show }
							triggerRef={ triggerRef }
							onClose={ closeTooltip }
							inline={ inline }
						/>
						<button>Outside</button>
					</>
				);
			};
			try {
				render( <ControlledTooltip /> );
				const trigger = screen.getByRole( 'button', { name: 'Toggle' } );
				await user.click( trigger );
				expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
				expect( trigger ).not.toHaveFocus();
				await user.pointer( { target: trigger, keys: '[MouseLeft>]' } );
				expect( trigger ).toHaveFocus();
				act( () => jest.advanceTimersByTime( 100 ) );
				expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
				await user.pointer( { target: trigger, keys: '[/MouseLeft]' } );
				expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
				await user.click( trigger );
				await user.keyboard( '{Escape}' );
				expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
				expect( trigger ).toHaveFocus();
				onClose.mockClear();
				await user.keyboard( '{Enter}' );
				expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
				await user.tab( { shift: true } );
				act( () => jest.advanceTimersByTime( 100 ) );
				expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
				await user.keyboard( '{Escape}' );
				expect( onClose ).toHaveBeenCalledTimes( 1 );
				await user.click( trigger );
				await user.pointer( { target: trigger, keys: '[MouseLeft>]' } );
				act( () => jest.advanceTimersByTime( 100 ) );
				expect( screen.getByText( 'Content block' ) ).toBeInTheDocument();
				onClose.mockClear();
				await user.keyboard( '{Escape}' );
				expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
				expect( onClose ).toHaveBeenCalledTimes( 1 );
				await user.pointer( {
					target: screen.getByRole( 'button', { name: 'Outside' } ),
					keys: '[/MouseLeft]',
				} );
				await user.click( trigger );
				act( () => screen.getByRole( 'button', { name: 'Outside' } ).focus() );
				act( () => jest.advanceTimersByTime( 100 ) );
				expect( screen.queryByText( 'Content block' ) ).not.toBeInTheDocument();
			} finally {
				jest.useRealTimers();
			}
		}
	);

	it( 'renders the icon tooltip', () => {
		render( <IconTooltip { ...testProps } /> );
		expect( screen.getByTestId( 'icon-tooltip_wrapper' ) ).toBeInTheDocument();
	} );
} );
