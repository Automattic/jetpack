import { act, renderHook } from '@testing-library/react';
import { useFunnelSelection } from '../private/use-funnel-selection';

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

			act( () => {
				result.current.handleBarClick( 'test-step' );
			} );

			const stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( true );
			expect( stepState.isBlurred ).toBe( false );
		} );

		it( 'blurs other steps when one is selected', () => {
			const { result } = renderHook( () => useFunnelSelection() );

			act( () => {
				result.current.handleBarClick( 'selected-step' );
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

			// First click to select
			act( () => {
				result.current.handleBarClick( 'test-step' );
			} );

			let stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( true );

			// Second click to deselect
			act( () => {
				result.current.handleBarClick( 'test-step' );
			} );

			stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( false );
			expect( stepState.isBlurred ).toBe( false );
		} );

		it( 'switches selection when clicking different bar', () => {
			const { result } = renderHook( () => useFunnelSelection() );

			// Select first step
			act( () => {
				result.current.handleBarClick( 'step1' );
			} );

			// Select second step
			act( () => {
				result.current.handleBarClick( 'step2' );
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

	describe( 'Clear Selection', () => {
		it( 'clears selection when clearSelection is called', () => {
			const { result } = renderHook( () => useFunnelSelection() );

			// First select a step
			act( () => {
				result.current.handleBarClick( 'test-step' );
			} );

			let stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( true );

			// Clear selection
			act( () => {
				result.current.clearSelection();
			} );

			stepState = result.current.getStepState( 'test-step' );
			expect( stepState.isClicked ).toBe( false );
			expect( stepState.isBlurred ).toBe( false );
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

			act( () => {
				result.current.handleBarClick( 'selected-step' );
			} );

			const stepState = result.current.getStepState( 'selected-step' );
			expect( stepState ).toEqual( {
				isClicked: true,
				isBlurred: false,
			} );
		} );

		it( 'returns correct state for blurred steps', () => {
			const { result } = renderHook( () => useFunnelSelection() );

			act( () => {
				result.current.handleBarClick( 'selected-step' );
			} );

			const blurredStepState = result.current.getStepState( 'other-step' );
			expect( blurredStepState ).toEqual( {
				isClicked: false,
				isBlurred: true,
			} );
		} );
	} );
} );
