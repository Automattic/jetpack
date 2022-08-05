const { mockGitHubContext, setInputData } = require( './test-utils' );

const testSHA = '12345abcd';
const branch = 'trunk';
const repo = 'foo/bar';
const commitURL = 'https://github.com/commit/123';
const commitId = '123';

beforeAll( () => {
	setInputData( { repo } );
} );

describe( 'Notification text', () => {
	test.each`
		event       | isFailure  | expected
		${ 'push' } | ${ false } | ${ `Tests passed for commit <${ commitURL }|${ commitId }> on branch *${ branch }*` }
		${ 'push' } | ${ true }  | ${ `Tests failed for commit <${ commitURL }|${ commitId }> on branch *${ branch }*` }
	`(
		`Message text is correct for $event event and workflow failed $isFailure`,
		async ( { event, isFailure, expected } ) => {
			// Mock GitHub context
			mockGitHubContext( {
				payload: { head_commit: { url: commitURL, id: 123 } },
				ref: `refs/heads/${ branch }`,
				sha: testSHA,
				eventName: event,
			} );

			// Mock workflow conclusion
			const utils = require( '../src/utils' );
			jest.spyOn( utils, 'isWorkflowFailed' ).mockReturnValueOnce( isFailure );

			await expect( utils.getNotificationText( isFailure ) ).resolves.toBe( expected );
		}
	);
} );
