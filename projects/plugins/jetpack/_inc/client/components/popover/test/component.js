import userEvent from '@testing-library/user-event';
import { useState, useCallback } from '@wordpress/element';
import debugFactory from 'debug';
import React from 'react';
import { render, screen, waitFor } from 'test/test-utils';
import Popover from '../index';

jest.mock( 'debug', () => {
	const debug = jest.fn();
	return jest.fn( () => debug );
} );

const TestComponent = ( { ignoreContext, nonDomObjectContext } ) => {
	const [ context, setContext ] = useState( () => {
		if ( nonDomObjectContext ) {
			return {};
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
			} else {
				newContext = null;
			}
			setContext( newContext );
			setIsVisible( false );
		} else {
			setContext( document.createElement( 'div' ) );
			setIsVisible( true );
		}
	}, [ context, nonDomObjectContext ] );

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
	let debug;

	beforeEach( () => {
		debug = debugFactory( 'calypso:popover' );
	} );

	afterEach( () => {
		jest.clearAllMocks();
	} );

	it( 'should not show Popover when context is not a DOM element', async () => {
		render( <TestComponent nonDomObjectContext={ true } /> );
		await userEvent.click( screen.getByText( 'Toggle Context', { selector: 'button' } ) );
		await waitFor( () => {
			expect( screen.queryByText( 'Popover Content' ) ).not.toBeInTheDocument();
		} );

		const debugCalls = debug.mock.calls.flat();
		const containsSpecificString = debugCalls.some(
			message =>
				typeof message === 'string' && message.includes( 'Expected a DOM node for props.context' )
		);
		expect( containsSpecificString ).toBe( true );
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

		// Simulate a click outside the ignoreContextRef
		await userEvent.click( document.createElement( 'div' ) );

		await waitFor( () => {
			expect( screen.getByText( 'Popover Content' ) ).toBeInTheDocument();
		} );
	} );
} );
