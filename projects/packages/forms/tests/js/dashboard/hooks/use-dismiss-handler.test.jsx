/**
 * External dependencies
 */
import { describe, expect, it, jest } from '@jest/globals';
import { renderHook } from '@testing-library/react';

const { default: useDismissHandler } =
	await import( '../../../../src/dashboard/hooks/use-dismiss-handler' );

describe( 'useDismissHandler', () => {
	it.each( [ 'close-press', 'escape-key', 'outside-press' ] )(
		'calls onCancel when closed with the %s reason',
		reason => {
			const onCancel = jest.fn();
			const { result } = renderHook( () => useDismissHandler( onCancel ) );

			result.current( false, { reason } );

			expect( onCancel ).toHaveBeenCalledTimes( 1 );
		}
	);

	it( 'does not call onCancel after a confirm', () => {
		const onCancel = jest.fn();
		const { result } = renderHook( () => useDismissHandler( onCancel ) );

		result.current( false, { reason: 'imperative-action' } );

		expect( onCancel ).not.toHaveBeenCalled();
	} );

	it( 'does not call onCancel when opening', () => {
		const onCancel = jest.fn();
		const { result } = renderHook( () => useDismissHandler( onCancel ) );

		result.current( true, { reason: 'trigger-press' } );

		expect( onCancel ).not.toHaveBeenCalled();
	} );
} );
