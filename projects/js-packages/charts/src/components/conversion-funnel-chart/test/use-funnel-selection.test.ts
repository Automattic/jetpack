import { act, renderHook } from '@testing-library/react';
import { useFunnelSelection } from '../hooks/use-funnel-selection';

describe( 'useFunnelSelection', () => {
	describe( 'Initial State', () => {
		it( 'starts with no step selected', () => {
			const { result } = renderHook( () => useFunnelSelection() );

			const stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( false );
			expect( stepState.isBlurred ).toBe( false );
		} );
	} );

	describe( 'Bar Click Handling', () => {
		it( 'selects a step when bar is clicked', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockEvent = {
				stopPropagation: jest.fn(),
			} as unknown as React.MouseEvent;

			act( () => {
				result.current.handleBarClick( 'test-step', mockEvent );
			} );

			const stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( true );
			expect( stepState.isBlurred ).toBe( false );
			expect( mockEvent.stopPropagation ).toHaveBeenCalled();
		} );

		it( 'blurs other steps when one is selected', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockEvent = {
				stopPropagation: jest.fn(),
			} as unknown as React.MouseEvent;

			act( () => {
				result.current.handleBarClick( 'selected-step', mockEvent );
			} );

			const selectedState = result.current.getStepState( 'selected-step' );
			const otherState = result.current.getStepState( 'other-step' );

			expect( selectedState.isClicked ).toBe( true );
			expect( selectedState.isBlurred ).toBe( false );
			expect( otherState.isClicked ).toBe( false );
			expect( otherState.isBlurred ).toBe( true );
		} );

		it( 'deselects step when clicking the same bar again', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockEvent = {
				stopPropagation: jest.fn(),
			} as unknown as React.MouseEvent;

			// First click to select
			act( () => {
				result.current.handleBarClick( 'test-step', mockEvent );
			} );

			let stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( true );

			// Second click to deselect
			act( () => {
				result.current.handleBarClick( 'test-step', mockEvent );
			} );

			stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( false );
			expect( stepState.isBlurred ).toBe( false );
		} );

		it( 'switches selection when clicking different bar', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockEvent = {
				stopPropagation: jest.fn(),
			} as unknown as React.MouseEvent;

			// Select first step
			act( () => {
				result.current.handleBarClick( 'step1', mockEvent );
			} );

			// Select second step
			act( () => {
				result.current.handleBarClick( 'step2', mockEvent );
			} );

			const step1State = result.current.getStepState( 'step1' );
			const step2State = result.current.getStepState( 'step2' );

			expect( step1State.isClicked ).toBe( false );
			expect( step1State.isBlurred ).toBe( true );
			expect( step2State.isClicked ).toBe( true );
			expect( step2State.isBlurred ).toBe( false );
		} );
	} );

	describe( 'Keyboard Handling', () => {
		it( 'selects step on Enter key', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockEvent = {
				key: 'Enter',
				preventDefault: jest.fn(),
				stopPropagation: jest.fn(),
			} as unknown as React.KeyboardEvent;

			act( () => {
				result.current.handleBarKeyDown( 'test-step', mockEvent );
			} );

			const stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( true );
			expect( mockEvent.preventDefault ).toHaveBeenCalled();
			// Note: stopPropagation is not called in keyboard handler
		} );

		it( 'selects step on Space key', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockEvent = {
				key: ' ',
				preventDefault: jest.fn(),
				stopPropagation: jest.fn(),
			} as unknown as React.KeyboardEvent;

			act( () => {
				result.current.handleBarKeyDown( 'test-step', mockEvent );
			} );

			const stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( true );
			expect( mockEvent.preventDefault ).toHaveBeenCalled();
			// Note: stopPropagation is not called in keyboard handler
		} );

		it( 'ignores other keys', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockEvent = {
				key: 'Tab',
				preventDefault: jest.fn(),
				stopPropagation: jest.fn(),
			} as unknown as React.KeyboardEvent;

			act( () => {
				result.current.handleBarKeyDown( 'test-step', mockEvent );
			} );

			const stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( false );
			expect( mockEvent.preventDefault ).not.toHaveBeenCalled();
			expect( mockEvent.stopPropagation ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'Chart Click Handling', () => {
		it( 'deselects all steps when chart is clicked', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockBarEvent = {
				stopPropagation: jest.fn(),
			} as unknown as React.MouseEvent;
			const mockChartEvent = {} as React.MouseEvent;

			// First select a step
			act( () => {
				result.current.handleBarClick( 'test-step', mockBarEvent );
			} );

			let stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( true );

			// Then click chart to deselect
			act( () => {
				result.current.handleChartClick( mockChartEvent );
			} );

			stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( false );
			expect( stepState.isBlurred ).toBe( false );
		} );
	} );

	describe( 'Chart Keyboard Handling', () => {
		it( 'deselects all steps on Escape key', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockBarEvent = {
				stopPropagation: jest.fn(),
			} as unknown as React.MouseEvent;
			const mockKeyEvent = {
				key: 'Escape',
				preventDefault: jest.fn(),
			} as unknown as React.KeyboardEvent;

			// First select a step
			act( () => {
				result.current.handleBarClick( 'test-step', mockBarEvent );
			} );

			// Then press Escape on chart
			act( () => {
				result.current.handleChartKeyDown( mockKeyEvent );
			} );

			const stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( false );
		} );

		it( 'does not deselect on non-Escape keys', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockBarEvent = {
				stopPropagation: jest.fn(),
			} as unknown as React.MouseEvent;
			const mockKeyEvent = {
				key: 'Enter',
				preventDefault: jest.fn(),
			} as unknown as React.KeyboardEvent;

			// First select a step
			act( () => {
				result.current.handleBarClick( 'test-step', mockBarEvent );
			} );

			// Then press Enter on chart (should not deselect)
			act( () => {
				result.current.handleChartKeyDown( mockKeyEvent );
			} );

			const stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( true ); // Should remain selected
			expect( mockKeyEvent.preventDefault ).not.toHaveBeenCalled();
		} );
	} );

	describe( 'getStepState', () => {
		it( 'returns correct state for unselected steps', () => {
			const { result } = renderHook( () => useFunnelSelection() );

			const stepState = result.current.getStepState( 'test-step' );
			expect( stepState ).toEqual( {
				isClicked: false,
				isBlurred: false,
			} );
		} );

		it( 'returns correct state for selected step', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockEvent = {
				stopPropagation: jest.fn(),
			} as unknown as React.MouseEvent;

			act( () => {
				result.current.handleBarClick( 'selected-step', mockEvent );
			} );

			const stepState = result.current.getStepState( 'selected-step' );
			expect( stepState ).toEqual( {
				isClicked: true,
				isBlurred: false,
			} );
		} );

		it( 'returns correct state for blurred steps', () => {
			const { result } = renderHook( () => useFunnelSelection() );
			const mockEvent = {
				stopPropagation: jest.fn(),
			} as unknown as React.MouseEvent;

			act( () => {
				result.current.handleBarClick( 'selected-step', mockEvent );
			} );

			const blurredStepState = result.current.getStepState( 'other-step' );
			expect( blurredStepState ).toEqual( {
				isClicked: false,
				isBlurred: true,
			} );
		} );
	} );
} );
