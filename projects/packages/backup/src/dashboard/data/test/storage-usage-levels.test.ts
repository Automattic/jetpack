import { getUsageLevel, StorageUsageLevels } from '../storage-usage-levels';

const GB = 1024 * 1024 * 1024;

type Overrides = {
	used?: number | null;
	available?: number | null;
	minDaysOfBackupsAllowed?: number | null;
	daysOfBackupsAllowed?: number | null;
	retentionDays?: number | null;
	daysOfBackupsSaved?: number | null;
};

/**
 * Call `getUsageLevel` with the four day-counts all truthy by default.
 *
 * The day-count block is the part of the derivation most tests want kept
 * out of the way, and spelling six positional arguments at every call
 * site hides which one a case is actually varying.
 *
 * @param overrides - Fields to replace.
 * @return The derived level.
 */
function level( overrides: Overrides = {} ) {
	const args = {
		used: 10 * GB,
		available: 100 * GB,
		minDaysOfBackupsAllowed: 7,
		daysOfBackupsAllowed: 30,
		retentionDays: 30,
		daysOfBackupsSaved: 30,
		...overrides,
	};
	return getUsageLevel(
		args.used,
		args.available,
		args.minDaysOfBackupsAllowed,
		args.daysOfBackupsAllowed,
		args.retentionDays,
		args.daysOfBackupsSaved
	);
}

describe( 'getUsageLevel', () => {
	describe( 'unknown inputs', () => {
		const unknowns: Array< [ string, Overrides ] > = [
			[ 'used is undefined', { used: undefined } ],
			[ 'used is null', { used: null } ],
			[ 'available is undefined', { available: undefined } ],
			[ 'available is null', { available: null } ],
		];

		it.each( unknowns )( 'returns null when %s', ( _label, overrides ) => {
			expect( level( overrides ) ).toBeNull();
		} );

		it( 'distinguishes "unknown" from "empty" — 0 bytes used is a real answer', () => {
			expect( level( { used: 0 } ) ).toBe( StorageUsageLevels.Normal );
		} );
	} );

	describe( 'percentage thresholds', () => {
		const thresholds: Array< [ number, string ] > = [
			[ 0, StorageUsageLevels.Normal ],
			[ 64, StorageUsageLevels.Normal ],
			[ 65, StorageUsageLevels.Warning ],
			[ 79, StorageUsageLevels.Warning ],
			[ 80, StorageUsageLevels.Critical ],
			[ 99, StorageUsageLevels.Critical ],
			[ 100, StorageUsageLevels.Full ],
			[ 150, StorageUsageLevels.Full ],
		];

		it.each( thresholds )( 'reads %i%% as %s', ( percent, expected ) => {
			// Day-counts left un-truthy so only the threshold table runs.
			expect(
				level( {
					used: percent * GB,
					available: 100 * GB,
					minDaysOfBackupsAllowed: 0,
				} )
			).toBe( expected );
		} );
	} );

	describe( 'the day-count block', () => {
		// This is the behaviour worth pinning: all four counts must be
		// truthy or the block is skipped entirely and the percentage
		// table decides on its own. A site missing any one of them —
		// which is every site whose `/policies` read failed — therefore
		// never sees `BackupsDiscarded`, and reads exactly-100% as
		// `Full` on the threshold alone.
		const missingCounts: Array< [ string, Overrides ] > = [
			[ 'minDaysOfBackupsAllowed', { minDaysOfBackupsAllowed: 0 } ],
			[ 'daysOfBackupsAllowed', { daysOfBackupsAllowed: 0 } ],
			[ 'retentionDays', { retentionDays: 0 } ],
			[ 'daysOfBackupsSaved', { daysOfBackupsSaved: 0 } ],
		];

		it.each( missingCounts )(
			'is skipped when %s is falsy, leaving the threshold table in charge',
			( _l, zeroed ) => {
				// Over limit, and holding fewer days than the minimum: the
				// block would say `Full`. With one count missing it can't run,
				// and 110% lands on `Full` from the threshold table anyway —
				// so assert the discriminating case instead, below.
				expect(
					level( {
						used: 50 * GB,
						available: 100 * GB,
						daysOfBackupsAllowed: 7,
						retentionDays: 30,
						...zeroed,
					} )
				).toBe( StorageUsageLevels.Normal );
			}
		);

		it( 'reports BackupsDiscarded at only 50% used, when retention was cut short', () => {
			// The discriminating case: half full by bytes, but the site is
			// keeping 7 days where the plan promises 30. Only the day-count
			// block can see this — the threshold table says Normal.
			expect(
				level( {
					used: 50 * GB,
					available: 100 * GB,
					daysOfBackupsAllowed: 7,
					retentionDays: 30,
				} )
			).toBe( StorageUsageLevels.BackupsDiscarded );
		} );

		it( 'reports Full over limit when backups are already down to the minimum', () => {
			expect(
				level( {
					used: 100 * GB,
					available: 100 * GB,
					minDaysOfBackupsAllowed: 7,
					daysOfBackupsSaved: 7,
				} )
			).toBe( StorageUsageLevels.Full );
		} );

		it( 'prefers Full over BackupsDiscarded when both apply', () => {
			expect(
				level( {
					used: 200 * GB,
					available: 100 * GB,
					minDaysOfBackupsAllowed: 7,
					daysOfBackupsAllowed: 7,
					retentionDays: 30,
					daysOfBackupsSaved: 7,
				} )
			).toBe( StorageUsageLevels.Full );
		} );
	} );

	describe( 'divide-by-zero guard', () => {
		// A zero limit is not "completely full", it is "no limit answer".
		// Short-circuiting to Normal is what keeps `Infinity%` out of the
		// threshold table.
		it( 'short-circuits a zero limit to Normal rather than dividing', () => {
			expect( level( { used: 10 * GB, available: 0, minDaysOfBackupsAllowed: 0 } ) ).toBe(
				StorageUsageLevels.Normal
			);
		} );

		it( 'still returns Normal for a zero limit with zero usage', () => {
			expect( level( { used: 0, available: 0, minDaysOfBackupsAllowed: 0 } ) ).toBe(
				StorageUsageLevels.Normal
			);
		} );

		it( 'does not let the day-count block reach the guard first', () => {
			// `used >= available` is true for 0 >= 0, but the block also
			// requires `available > 0`, so a zero limit can never be
			// reported as Full.
			expect(
				level( { used: 0, available: 0, minDaysOfBackupsAllowed: 30, daysOfBackupsSaved: 1 } )
			).toBe( StorageUsageLevels.Normal );
		} );
	} );
} );
