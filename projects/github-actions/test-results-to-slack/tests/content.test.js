const { mockGitHubContext, setInputData } = require( './test-utils' );

const testSHA = '12345abcd';
const branch = 'trunk';
const repo = 'foo/bar';
const commitURL = 'https://github.com/commit/123';
const commitId = '123';
const prUrl = 'https://github.com/foo/bar/pull/123';
const prNumber = '123';
const prTitle = 'Pull request title';

beforeAll( () => {
	setInputData( { repo } );
} );

describe( 'Notification text', () => {
	test.each`
		event               | isFailure  | expected
		${ 'push' }         | ${ false } | ${ `Tests passed for commit <${ commitURL }|${ commitId }> on branch *${ branch }*` }
		${ 'push' }         | ${ true }  | ${ `Tests failed for commit <${ commitURL }|${ commitId }> on branch *${ branch }*` }
		${ 'schedule' }     | ${ false } | ${ `Tests passed for commit <${ commitURL }|${ commitId }> on branch *${ branch }*` }
		${ 'schedule' }     | ${ true }  | ${ `Tests failed for commit <${ commitURL }|${ commitId }> on branch *${ branch }*` }
		${ 'pull_request' } | ${ false } | ${ `Tests passed for PR <${ prUrl }|${ prNumber }: ${ prTitle }>` }
		${ 'pull_request' } | ${ true }  | ${ `Tests failed for PR <${ prUrl }|${ prNumber }: ${ prTitle }>` }
	`(
		`Message text is correct for $event event and workflow failed $isFailure`,
		async ( { event, isFailure, expected } ) => {
			// Mock GitHub context
			await mockGitHubContext( {
				payload: {
					head_commit: { url: commitURL, id: 123 },
					pull_request: { html_url: prUrl, number: prNumber, title: prTitle },
				},
				ref: `refs/heads/${ branch }`,
				sha: testSHA,
				eventName: event,
			} );

			// Mock workflow conclusion
			const utils = require( '../src/utils' );
			const isWorkflowFailed = jest
				.spyOn( utils, 'isWorkflowFailed' )
				.mockReturnValueOnce( isFailure );
			await isWorkflowFailed();

			await expect( utils.getNotificationText( isFailure ) ).resolves.toBe( expected );
		}
	);
} );
