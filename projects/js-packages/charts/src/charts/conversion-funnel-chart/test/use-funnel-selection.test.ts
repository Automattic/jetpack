import { act, renderHook } from '@testing-library/react';
import { useFunnelSelection } from '../private/use-funnel-selection';

describe( 'useFunnelSelection', () => {
	it( 'starts with no step selected', () => {
		const { result } = renderHook( () => useFunnelSelection() );

		expect( result.current.getStepState( 'cart' ) ).toEqual( {
			isSelected: false,
			isBlurred: false,
		} );
	} );

	it( 'selects one step and blurs the others', () => {
		const { result } = renderHook( () => useFunnelSelection() );

		act( () => result.current.selectStep( 'sessions' ) );
		act( () => result.current.selectStep( 'cart' ) );

		expect( result.current.getStepState( 'cart' ) ).toEqual( {
			isSelected: true,
			isBlurred: false,
		} );
		expect( result.current.getStepState( 'sessions' ) ).toEqual( {
			isSelected: false,
			isBlurred: true,
		} );
	} );

	it( 'clears the selection and hides the tooltip', () => {
		const hideTooltip = jest.fn();
		const { result } = renderHook( () => useFunnelSelection( hideTooltip ) );

		act( () => result.current.selectStep( 'cart' ) );
		act( () => result.current.clearSelection() );

		expect( result.current.selectedStepId ).toBeNull();
		expect( result.current.getStepState( 'sessions' ).isBlurred ).toBe( false );
		expect( hideTooltip ).toHaveBeenCalled();
	} );
} );
