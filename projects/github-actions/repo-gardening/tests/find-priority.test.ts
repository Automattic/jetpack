import findPriority from '../src/utils/parse-content/find-priority.ts';

/**
 * Build an issue body with the expected markdown format for priority parsing.
 *
 * @param impact   - Impact level string.
 * @param severity - Severity level string.
 * @param extra    - Extra impact information.
 * @return Formatted issue body string.
 */
function buildBody( impact: string, severity: string, extra: string = '_No response_' ): string {
	return `### Site owner impact\n\n${ impact }\n\n### Severity\n\n${ severity }\n\n### What other impact(s) does this issue have?\n\n${ extra }\n`;
}

const ISOLATED = 'Fewer than 20% of the total website/platform users';
const SCATTERED = 'Between 20% and 60% of the total website/platform users';
const WIDESPREAD = 'More than 60% of the total website/platform users';

describe( 'findPriority', () => {
	test( 'returns TBD when body has no priority indicators', () => {
		expect( findPriority( 'Just a regular issue body with no form fields.' ) ).toBe( 'TBD' );
	} );

	test( 'returns TBD when body is empty', () => {
		expect( findPriority( '' ) ).toBe( 'TBD' );
	} );

	test( 'returns TBD when severity is empty', () => {
		expect( findPriority( buildBody( ISOLATED, '' ) ) ).toBe( 'TBD' );
	} );

	test( 'returns TBD when severity is _No response_', () => {
		expect( findPriority( buildBody( ISOLATED, '_No response_' ) ) ).toBe( 'TBD' );
	} );

	// Critical severity
	test( 'Critical + isolated = High', () => {
		expect( findPriority( buildBody( ISOLATED, 'Critical' ) ) ).toBe( 'High' );
	} );

	test( 'Critical + scattered = BLOCKER', () => {
		expect( findPriority( buildBody( SCATTERED, 'Critical' ) ) ).toBe( 'BLOCKER' );
	} );

	test( 'Critical + widespread = BLOCKER', () => {
		expect( findPriority( buildBody( WIDESPREAD, 'Critical' ) ) ).toBe( 'BLOCKER' );
	} );

	// Major severity
	test( 'Major + isolated = Normal', () => {
		expect( findPriority( buildBody( ISOLATED, 'Major' ) ) ).toBe( 'Normal' );
	} );

	test( 'Major + scattered = High', () => {
		expect( findPriority( buildBody( SCATTERED, 'Major' ) ) ).toBe( 'High' );
	} );

	test( 'Major + widespread = BLOCKER', () => {
		expect( findPriority( buildBody( WIDESPREAD, 'Major' ) ) ).toBe( 'BLOCKER' );
	} );

	// Moderate severity
	test( 'Moderate + isolated = Low', () => {
		expect( findPriority( buildBody( ISOLATED, 'Moderate' ) ) ).toBe( 'Low' );
	} );

	test( 'Moderate + scattered = Normal', () => {
		expect( findPriority( buildBody( SCATTERED, 'Moderate' ) ) ).toBe( 'Normal' );
	} );

	test( 'Moderate + widespread = High', () => {
		expect( findPriority( buildBody( WIDESPREAD, 'Moderate' ) ) ).toBe( 'High' );
	} );

	// Minor severity (catch-all else branch)
	test( 'Minor + isolated = Low', () => {
		expect( findPriority( buildBody( ISOLATED, 'Minor' ) ) ).toBe( 'Low' );
	} );

	test( 'Minor + scattered = Low', () => {
		expect( findPriority( buildBody( SCATTERED, 'Minor' ) ) ).toBe( 'Low' );
	} );

	test( 'Minor + widespread = Normal', () => {
		expect( findPriority( buildBody( WIDESPREAD, 'Minor' ) ) ).toBe( 'Normal' );
	} );

	// Severity bumping from extras
	describe( 'extras bumping severity', () => {
		test( 'Individual site owner revenue bumps non-Critical to Major', () => {
			// Moderate + isolated would normally be Low, but revenue bump makes severity Major → Normal
			expect(
				findPriority( buildBody( ISOLATED, 'Moderate', 'Individual site owner revenue' ) )
			).toBe( 'Normal' );
		} );

		test( 'Agency or developer revenue bumps non-Critical to Major', () => {
			expect(
				findPriority( buildBody( SCATTERED, 'Moderate', 'Agency or developer revenue' ) )
			).toBe( 'High' );
		} );

		test( 'Platform revenue bumps to Critical', () => {
			// Minor + isolated with Platform revenue → Critical + isolated = High
			expect( findPriority( buildBody( ISOLATED, 'Minor', 'Platform revenue' ) ) ).toBe( 'High' );
		} );

		test( 'Platform revenue + widespread = BLOCKER', () => {
			expect( findPriority( buildBody( WIDESPREAD, 'Minor', 'Platform revenue' ) ) ).toBe(
				'BLOCKER'
			);
		} );

		test( 'No revenue impact does not bump severity', () => {
			expect( findPriority( buildBody( ISOLATED, 'Minor', 'No revenue impact' ) ) ).toBe( 'Low' );
		} );

		test( 'revenue does not bump when severity is already Critical', () => {
			// Critical + isolated = High regardless of individual revenue extras
			expect(
				findPriority( buildBody( ISOLATED, 'Critical', 'Individual site owner revenue' ) )
			).toBe( 'High' );
		} );

		test( 'Platform revenue overrides even Critical (stays Critical)', () => {
			// Critical + scattered = BLOCKER regardless
			expect( findPriority( buildBody( SCATTERED, 'Critical', 'Platform revenue' ) ) ).toBe(
				'BLOCKER'
			);
		} );
	} );
} );
