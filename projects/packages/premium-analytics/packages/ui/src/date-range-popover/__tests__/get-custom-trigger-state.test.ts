import {
	getCustomTriggerLabel,
	getCustomTriggerRange,
	getCustomTriggerState,
} from '../get-custom-trigger-state';

const stagedRange = {
	from: new Date( '2026-07-05T00:00:00.000Z' ),
	to: new Date( '2026-07-10T23:59:59.000Z' ),
};

const committedRange = {
	from: new Date( '2026-06-01T00:00:00.000Z' ),
	to: new Date( '2026-06-30T23:59:59.000Z' ),
};

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

	it( 'shows the staged range while a custom draft is open', () => {
		expect(
			getCustomTriggerLabel( {
				triggerState: 'staged',
				range: stagedRange,
				committedRange,
				customLabel,
				formatRange,
			} )
		).toBe( '2026-07-05T00:00:00.000Z–2026-07-10T23:59:59.000Z' );
	} );

	it( 'shows the committed range once the custom draft is applied', () => {
		expect(
			getCustomTriggerLabel( {
				triggerState: 'applied',
				range: stagedRange,
				committedRange,
				customLabel,
				formatRange,
			} )
		).toBe( '2026-06-01T00:00:00.000Z–2026-06-30T23:59:59.000Z' );
	} );

	// The range on screen belongs to the preset, so the trigger must not show a
	// second one (WOOA7S-1936).
	it( 'shows the custom label while a preset drives the range', () => {
		expect(
			getCustomTriggerLabel( {
				triggerState: 'idle',
				range: committedRange,
				committedRange,
				customLabel,
				formatRange,
			} )
		).toBe( customLabel );
	} );
} );

describe( 'getCustomTriggerRange', () => {
	it( 'holds the staged range while a custom draft is open', () => {
		expect(
			getCustomTriggerRange( { triggerState: 'staged', range: stagedRange, committedRange } )
		).toBe( stagedRange );
	} );

	it( 'holds the committed range once the custom draft is applied', () => {
		expect(
			getCustomTriggerRange( { triggerState: 'applied', range: stagedRange, committedRange } )
		).toBe( committedRange );
	} );

	it( 'holds no range while a preset drives one', () => {
		expect(
			getCustomTriggerRange( { triggerState: 'idle', range: committedRange, committedRange } )
		).toBeUndefined();
	} );
} );
