import userEvent from '@testing-library/user-event';
import { useState, useCallback } from '@wordpress/element';
import React from 'react';
import { render, screen, waitFor } from 'test/test-utils';
import Popover from '../index';

const TestComponent = ( { ignoreContext, nonDomObjectContext, nonDomRefContext } ) => {
	const [ context, setContext ] = useState( () => {
		if ( nonDomObjectContext ) {
			return {};
		}
		if ( nonDomRefContext ) {
			return { current: '' };
		}
		return null;
	} );
	const [ isVisible, setIsVisible ] = useState( false );

	const toggleContext = useCallback( () => {
		if ( context ) {
			// Determine new context based on props
			let newContext;
			if ( nonDomObjectContext ) {
				newContext = {};
			} else if ( nonDomRefContext ) {
				newContext = { current: '' };
			} else {
				newContext = null;
			}
			setContext( newContext );
			setIsVisible( false );
		} else {
			setContext( document.createElement( 'div' ) );
			setIsVisible( true );
		}
	}, [ context, nonDomObjectContext, nonDomRefContext ] );

	const handleClose = useCallback( () => {
		setContext( null );
		setIsVisible( false );
	}, [ setContext, setIsVisible ] );

	return (
		<div>
			<button onClick={ toggleContext }>Toggle Context</button>
			<Popover
				context={ context }
				isVisible={ isVisible }
				onClose={ handleClose }
				ignoreContext={ ignoreContext }
			>
				<div>Popover Content</div>
			</Popover>
		</div>
	);
};

describe( 'TestComponent', () => {
	it( 'should not show Popover when context is not a DOM element', async () => {
		const consoleErrorSpy = jest.spyOn( console, 'error' ).mockImplementation( () => {} );

		render( <TestComponent nonDomObjectContext={ true } /> );
		await userEvent.click( screen.getByText( 'Toggle Context', { selector: 'button' } ) );
		await waitFor( () => {
			expect( screen.queryByText( 'Popover Content' ) ).not.toBeInTheDocument();
		} );
		expect( consoleErrorSpy ).toHaveBeenCalledWith(
			'Expected a DOM node or a React ref for props.context',
			expect.anything()
		);

		consoleErrorSpy.mockRestore();
	} );
	it( 'should not show Popover when context is not a DOM element but it is a ref', async () => {
		render( <TestComponent nonDomRefContext={ true } /> );
		await userEvent.click( screen.getByText( 'Toggle Context', { selector: 'button' } ) );
		await waitFor( () => {
			expect( screen.queryByText( 'Popover Content' ) ).not.toBeInTheDocument();
		} );
	} );

	it( 'should show Popover when context is a DOM element', async () => {
		render( <TestComponent /> );

		await userEvent.click( screen.getByText( 'Toggle Context', { selector: 'button' } ) );
		await waitFor( () => {
			expect( screen.getByText( 'Popover Content' ) ).toBeInTheDocument();
		} );
	} );
	it( 'should handle ignoreContext correctly', async () => {
		const ignoreContextRef = React.createRef();

		render( <TestComponent ignoreContext={ ignoreContextRef } /> );

		await userEvent.click( screen.getByText( 'Toggle Context', { selector: 'button' } ) );

		await waitFor( () => {
			expect( screen.getByText( 'Popover Content' ) ).toBeInTheDocument();
		} );

		await userEvent.click( ignoreContextRef.current );

		await waitFor( () => {
			expect( screen.getByText( 'Popover Content' ) ).toBeInTheDocument();
		} );
	} );
} );
