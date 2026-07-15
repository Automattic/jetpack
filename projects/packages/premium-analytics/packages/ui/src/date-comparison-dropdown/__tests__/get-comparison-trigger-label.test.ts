import { getComparisonTriggerLabel } from '../date-comparison-dropdown';

describe( 'getComparisonTriggerLabel', () => {
	const preset = {
		id: 'previous-period' as const,
		label: 'Previous period',
		range: {
			from: new Date( '2026-06-02T00:00:00.000Z' ),
			to: new Date( '2026-06-08T23:59:59.000Z' ),
		},
	};

	it( 'returns the prefixed comparison range label', () => {
		expect(
			getComparisonTriggerLabel( {
				selectedPreset: preset,
				removeCompareToPrefix: false,
				noComparisonLabel: 'No comparison',
			} )
		).toMatch( /^Compare to: / );
	} );

	it( 'returns only the range when the prefix is removed', () => {
		expect(
			getComparisonTriggerLabel( {
				selectedPreset: preset,
				removeCompareToPrefix: true,
				noComparisonLabel: 'No comparison',
			} )
		).not.toMatch( /^Compare to: / );
	} );

	it( 'falls back to the no-comparison label when no preset is selected', () => {
		expect(
			getComparisonTriggerLabel( {
				selectedPreset: undefined,
				removeCompareToPrefix: false,
				noComparisonLabel: 'No comparison',
			} )
		).toBe( 'No comparison' );
	} );
} );
