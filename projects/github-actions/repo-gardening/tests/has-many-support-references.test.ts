import { jest } from '@jest/globals';
import type { IssueComment } from '@octokit/webhooks-types';

// Mock @actions/core before importing the module under test.
jest.unstable_mockModule( '@actions/core', () => ( {
	getInput: jest.fn(),
} ) );

const { getInput } = await import( '@actions/core' );
const { default: hasManySupportReferences } = await import(
	'../src/utils/parse-content/has-many-support-references.ts'
);

/**
 * Create a mock issue comment with a given login and body.
 *
 * @param login - The GitHub username of the comment author.
 * @param body  - The comment body text.
 * @return Mock issue comment object.
 */
function makeComment( login: string, body: string ): IssueComment {
	return { user: { login }, body } as unknown as IssueComment;
}

describe( 'hasManySupportReferences', () => {
	beforeEach( () => {
		( getInput as jest.Mock ).mockReturnValue( '10' );
	} );

	test( 'returns false when no comments exist', async () => {
		await expect( hasManySupportReferences( [] ) ).resolves.toBe( false );
	} );

	test( 'returns false when no bot comment with support references', async () => {
		const comments = [ makeComment( 'someuser', 'Regular comment' ) ];
		await expect( hasManySupportReferences( comments ) ).resolves.toBe( false );
	} );

	test( 'returns false when bot comment has fewer references than threshold', async () => {
		const body = '**Support References**\n- [ ] ref1\n- [ ] ref2';
		const comments = [ makeComment( 'github-actions[bot]', body ) ];
		await expect( hasManySupportReferences( comments ) ).resolves.toBe( false );
	} );

	test( 'returns true when bot comment meets threshold', async () => {
		const refs = Array.from( { length: 10 }, ( _, i ) => `- [ ] ref${ i + 1 }` ).join( '\n' );
		const body = `**Support References**\n${ refs }`;
		const comments = [ makeComment( 'github-actions[bot]', body ) ];
		await expect( hasManySupportReferences( comments ) ).resolves.toBe( true );
	} );

	test( 'returns true when references exceed threshold', async () => {
		const refs = Array.from( { length: 15 }, ( _, i ) => `- [ ] ref${ i + 1 }` ).join( '\n' );
		const body = `**Support References**\n${ refs }`;
		const comments = [ makeComment( 'github-actions[bot]', body ) ];
		await expect( hasManySupportReferences( comments ) ).resolves.toBe( true );
	} );

	test( 'only counts unchecked (to-do) items, not checked ones', async () => {
		// 5 unchecked + 5 checked = only 5 count toward threshold
		const unchecked = Array.from( { length: 5 }, ( _, i ) => `- [ ] ref${ i }` ).join( '\n' );
		const checked = Array.from( { length: 5 }, ( _, i ) => `- [x] done${ i }` ).join( '\n' );
		const body = `**Support References**\n${ unchecked }\n${ checked }`;
		const comments = [ makeComment( 'github-actions[bot]', body ) ];
		await expect( hasManySupportReferences( comments ) ).resolves.toBe( false );
	} );

	test( 'respects custom threshold from input', async () => {
		( getInput as jest.Mock ).mockReturnValue( '3' );
		const refs = '- [ ] ref1\n- [ ] ref2\n- [ ] ref3';
		const body = `**Support References**\n${ refs }`;
		const comments = [ makeComment( 'github-actions[bot]', body ) ];
		await expect( hasManySupportReferences( comments ) ).resolves.toBe( true );
	} );

	test( 'ignores non-bot comments with support references', async () => {
		const refs = Array.from( { length: 10 }, ( _, i ) => `- [ ] ref${ i + 1 }` ).join( '\n' );
		const body = `**Support References**\n${ refs }`;
		const comments = [ makeComment( 'regular-user', body ) ];
		await expect( hasManySupportReferences( comments ) ).resolves.toBe( false );
	} );
} );
