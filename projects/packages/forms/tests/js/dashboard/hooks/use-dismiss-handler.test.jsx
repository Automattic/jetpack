/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const { default: useDismissHandler } =
	await import( '../../../../src/dashboard/hooks/use-dismiss-handler' );

describe( 'useDismissHandler', () => {
	it.each( [ 'close-press', 'escape-key', 'outside-press' ] )(
		'calls onDismiss when closed with the %s reason',
		reason => {
			const onDismiss = jest.fn();
			const { result } = renderHook( () => useDismissHandler( onDismiss ) );

			result.current( false, { reason } );

			expect( onDismiss ).toHaveBeenCalledTimes( 1 );
		}
	);

	it( 'does not call onDismiss after a confirm', () => {
		const onDismiss = jest.fn();
		const { result } = renderHook( () => useDismissHandler( onDismiss ) );

		result.current( false, { reason: 'imperative-action' } );

		expect( onDismiss ).not.toHaveBeenCalled();
	} );

	it( 'does not call onDismiss when opening', () => {
		const onDismiss = jest.fn();
		const { result } = renderHook( () => useDismissHandler( onDismiss ) );

		result.current( true, { reason: 'trigger-press' } );

		expect( onDismiss ).not.toHaveBeenCalled();
	} );
} );
