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
const runId = '123456789';

beforeAll( () => {
	setInputData( { repo } );
} );

describe( 'Notification text', () => {
	test.each`
		event               | isFailure  | expected
		${ 'push' }         | ${ false } | ${ { text: `Tests passed on ${ ref_type } *${ ref_name }*` } }
		${ 'push' }         | ${ true }  | ${ { text: `Tests failed on ${ ref_type } *${ ref_name }*` } }
		${ 'schedule' }     | ${ false } | ${ { text: `Tests passed for scheduled run on ${ ref_type } *${ ref_name }*` } }
		${ 'schedule' }     | ${ true }  | ${ { text: `Tests failed for scheduled run on ${ ref_type } *${ ref_name }*` } }
		${ 'pull_request' } | ${ false } | ${ { text: `Tests passed for pull request *#${ prNumber }*` } }
		${ 'pull_request' } | ${ true }  | ${ { text: `Tests failed for pull request *#${ prNumber }*` } }
		${ 'unsupported' }  | ${ true }  | ${ { text: `Tests failed for ${ sha }` } }
	`(
		`Message text is correct for $event event and workflow failed=$isFailure`,
		async ( { event, isFailure, expected } ) => {
			// Mock GitHub context
			await mockGitHubContext( {
				payload: {
					head_commit: { url: commitURL, id: '123', author: { name: 'John Doe' } },
					pull_request: { html_url: prUrl, number: prNumber, title: prTitle },
				},
				ref_name,
				ref_type,
				sha,
				eventName: event,
				repository: repo,
				server_url: 'https://github.com',
				run_id: runId,
			} );

			// Mock workflow conclusion
			const utils = require( '../src/utils' );
			const isWorkflowFailed = jest
				.spyOn( utils, 'isWorkflowFailed' )
				.mockReturnValueOnce( isFailure );
			await isWorkflowFailed();
			const actual = await utils.getNotificationData( isFailure );

			expect( actual.text ).toBe( expected.text );
		}
	);
} );
