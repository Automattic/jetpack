import userEvent from '@testing-library/user-event';
import { useState, useCallback } from '@wordpress/element';
import React from 'react';
import { render, screen, waitFor } from 'test/test-utils';
import Popover from '../index';

const TestComponent = ( { ignoreContext } ) => {
	const [ context, setContext ] = useState( null );
	const [ isVisible, setIsVisible ] = useState( false ); // Manage isVisible dynamically

	const toggleContext = useCallback( () => {
		const newContext = context ? null : document.createElement( 'div' );
		setContext( newContext );
		setIsVisible( !! newContext );
	}, [ context, setContext, setIsVisible ] );

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
		render( <TestComponent /> );

		expect( screen.queryByText( 'Popover Content' ) ).not.toBeInTheDocument();
	} );

	it( 'should show Popover when context is a DOM element', async () => {
		render( <TestComponent /> );

		await userEvent.click( screen.getByText( 'Toggle Context', { selector: 'button' } ) );
		await waitFor( () => {
			expect( screen.getByText( 'Popover Content' ) ).toBeInTheDocument();
		} );
	} );
	it( 'should handle ignoreContext correctly', async () => {
		const ignoreContextRef = React.createRef(); // Mock ref for ignoreContext

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
