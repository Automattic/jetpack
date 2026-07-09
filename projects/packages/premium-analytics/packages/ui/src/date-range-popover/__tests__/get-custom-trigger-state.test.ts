import { getCustomTriggerState } from '../get-custom-trigger-state';

describe( 'getCustomTriggerState', () => {
	it( 'returns idle when a preset is applied and there is no custom draft', () => {
		expect(
			getCustomTriggerState( {
				presetId: 'last-30-days',
				appliedPresetId: 'last-30-days',
				canApply: false,
				isOpen: false,
			} )
		).toBe( 'idle' );
	} );

	it( 'returns applied when custom is committed with no pending draft', () => {
		expect(
			getCustomTriggerState( {
				presetId: 'custom',
				appliedPresetId: 'custom',
				canApply: false,
				isOpen: false,
			} )
		).toBe( 'applied' );
	} );

	it( 'returns applied while the popover is open with no changes to a committed custom range', () => {
		expect(
			getCustomTriggerState( {
				presetId: 'custom',
				appliedPresetId: 'custom',
				canApply: false,
				isOpen: true,
			} )
		).toBe( 'applied' );
	} );

	it( 'returns staged when a custom draft differs from the applied preset', () => {
		expect(
			getCustomTriggerState( {
				presetId: 'custom',
				appliedPresetId: 'last-30-days',
				canApply: true,
				isOpen: true,
			} )
		).toBe( 'staged' );
	} );

	it( 'returns staged when a custom draft persists after closing the popover', () => {
		expect(
			getCustomTriggerState( {
				presetId: 'custom',
				appliedPresetId: 'last-30-days',
				canApply: true,
				isOpen: false,
			} )
		).toBe( 'staged' );
	} );

	it( 'returns staged when editing an already-applied custom range', () => {
		expect(
			getCustomTriggerState( {
				presetId: 'custom',
				appliedPresetId: 'custom',
				canApply: true,
				isOpen: false,
			} )
		).toBe( 'staged' );
	} );
} );
