import { getCommittedCustomRange, shouldRestoreLastCustomRange } from '../last-custom-range';

describe( 'getCommittedCustomRange', () => {
	it( 'returns the range when custom is committed', () => {
		const from = new Date( '2026-07-05T00:00:00' );
		const to = new Date( '2026-07-10T23:59:59' );

		expect(
			getCommittedCustomRange( 'custom', {
				from,
				to,
			} )
		).toEqual( { from, to } );
	} );

	it( 'returns null for preset ranges', () => {
		expect(
			getCommittedCustomRange( 'last-30-days', {
				from: new Date( '2026-06-01T00:00:00' ),
				to: new Date( '2026-06-30T23:59:59' ),
			} )
		).toBeNull();
	} );
} );

describe( 'shouldRestoreLastCustomRange', () => {
	it( 'restores when opening custom from an applied preset', () => {
		expect(
			shouldRestoreLastCustomRange( {
				isOpen: true,
				appliedPresetId: 'last-30-days',
				presetId: 'last-30-days',
				hasLastCustomRange: true,
			} )
		).toBe( true );
	} );

	it( 'does not restore when custom is already applied', () => {
		expect(
			shouldRestoreLastCustomRange( {
				isOpen: true,
				appliedPresetId: 'custom',
				presetId: 'custom',
				hasLastCustomRange: true,
			} )
		).toBe( false );
	} );

	it( 'does not restore when a custom draft is already staged', () => {
		expect(
			shouldRestoreLastCustomRange( {
				isOpen: true,
				appliedPresetId: 'last-30-days',
				presetId: 'custom',
				hasLastCustomRange: true,
			} )
		).toBe( false );
	} );

	it( 'does not restore when the popover is closed', () => {
		expect(
			shouldRestoreLastCustomRange( {
				isOpen: false,
				appliedPresetId: 'last-30-days',
				presetId: 'last-30-days',
				hasLastCustomRange: true,
			} )
		).toBe( false );
	} );
} );
