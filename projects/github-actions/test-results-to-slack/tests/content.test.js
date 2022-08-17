const { mockGitHubContext, setInputData } = require( './test-utils' );

const sha = '12345abcd';
const ref_name = 'trunk';
const ref_type = 'branch';
const repo = 'foo/bar';
const commitId = '123';
const commitURL = `https://github.com/commit/${ commitId }`;
const prNumber = '123';
const prUrl = `https://github.com/foo/bar/pull/${ prNumber }`;
const prTitle = 'Pull request title';

beforeAll( () => {
	setInputData( { repo } );
} );

describe( 'Notification text', () => {
	test.each`
		event               | isFailure  | expected
		${ 'push' }         | ${ false } | ${ `Tests passed for commit <${ commitURL }|${ commitId }> on ${ ref_type } *${ ref_name }*` }
		${ 'push' }         | ${ true }  | ${ `Tests failed for commit <${ commitURL }|${ commitId }> on ${ ref_type } *${ ref_name }*` }
		${ 'schedule' }     | ${ false } | ${ `Tests passed for scheduled run on ${ ref_type } *${ ref_name }*` }
		${ 'schedule' }     | ${ true }  | ${ `Tests failed for scheduled run on ${ ref_type } *${ ref_name }*` }
		${ 'pull_request' } | ${ false } | ${ `Tests passed for PR <${ prUrl }|${ prNumber }: ${ prTitle }>` }
		${ 'pull_request' } | ${ true }  | ${ `Tests failed for PR <${ prUrl }|${ prNumber }: ${ prTitle }>` }
		${ 'unsupported' }  | ${ true }  | ${ `Tests failed for ${ sha }` }
	`(
		`Message text is correct for $event event and workflow failed=$isFailure`,
		async ( { event, isFailure, expected } ) => {
			// Mock GitHub context
			await mockGitHubContext( {
				payload: {
					head_commit: { url: commitURL, id: 123 },
					pull_request: { html_url: prUrl, number: prNumber, title: prTitle },
				},
				ref_name,
				ref_type,
				sha,
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
