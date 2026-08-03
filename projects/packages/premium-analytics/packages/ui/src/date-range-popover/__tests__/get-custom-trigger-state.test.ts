import { getCustomTriggerLabel, getCustomTriggerState } from '../get-custom-trigger-state';

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

	it( 'returns staged for an unapplied custom draft even while closed', () => {
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

describe( 'getCustomTriggerLabel', () => {
	const customLabel = 'Custom';
	const formatRange = ( { from, to }: { from?: Date; to?: Date } ) =>
		`${ from?.toISOString() ?? '' }–${ to?.toISOString() ?? '' }`;

	const customRange = {
		from: new Date( '2026-07-05T00:00:00.000Z' ),
		to: new Date( '2026-07-10T23:59:59.000Z' ),
	};

	const formatted = '2026-07-05T00:00:00.000Z–2026-07-10T23:59:59.000Z';

	// Idle is "a preset is driving the range". Echoing a custom range there reads
	// as if it were applied, and it also desynced the measuring probe, which has
	// only the props to work from and so always resolved this case to the label.
	it( 'names itself while idle, whatever custom range ran before', () => {
		expect(
			getCustomTriggerLabel( {
				triggerState: 'idle',
				range: customRange,
				committedRange: customRange,
				customLabel,
				formatRange,
			} )
		).toBe( customLabel );
	} );

	it( 'shows the staged range while the popover is open', () => {
		expect(
			getCustomTriggerLabel( {
				triggerState: 'staged',
				range: customRange,
				committedRange: {},
				customLabel,
				formatRange,
			} )
		).toBe( formatted );
	} );

	it( 'shows the committed range once a custom range is applied', () => {
		expect(
			getCustomTriggerLabel( {
				triggerState: 'applied',
				range: {},
				committedRange: customRange,
				customLabel,
				formatRange,
			} )
		).toBe( formatted );
	} );
} );
