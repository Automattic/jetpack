const { mockGitHubContext, mockContextExtras } = require( './test-utils' );

const sha = '12345abcd';
const refName = 'trunk';
const refType = 'branch';
const repository = 'foo/bar';
const commitId = '123';
const commitURL = `https://github.com/commit/${ commitId }`;
const prNumber = '123';
const prUrl = `https://github.com/foo/bar/pull/${ prNumber }`;
const prTitle = 'Pull request title';
const runId = '123456789';
const actor = 'octocat';
const triggeringActor = 'another-octocat';
const runAttempt = '1';

describe( 'Notification text', () => {
	test.each`
		eventName           | isFailure  | expected
		${ 'push' }         | ${ false } | ${ { text: `Tests passed on ${ refType } *${ refName }*` } }
		${ 'push' }         | ${ true }  | ${ { text: `Tests failed on ${ refType } *${ refName }*` } }
		${ 'schedule' }     | ${ false } | ${ { text: `Tests passed for scheduled run on ${ refType } *${ refName }*` } }
		${ 'schedule' }     | ${ true }  | ${ { text: `Tests failed for scheduled run on ${ refType } *${ refName }*` } }
		${ 'pull_request' } | ${ false } | ${ { text: `Tests passed for pull request *#${ prNumber }*` } }
		${ 'pull_request' } | ${ true }  | ${ { text: `Tests failed for pull request *#${ prNumber }*` } }
		${ 'unsupported' }  | ${ true }  | ${ { text: `Tests failed for ${ sha }` } }
	`(
		`Message text is correct for $event event and workflow failed=$isFailure`,
		async ( { eventName, isFailure, expected } ) => {
			// Mock GitHub context
			mockGitHubContext( {
				payload: {
					head_commit: { url: commitURL, id: '123' },
					pull_request: { html_url: prUrl, number: prNumber, title: prTitle },
				},
				sha,
				eventName,
				runId,
				actor,
			} );
			mockContextExtras( { repository, refType, refName, triggeringActor, runAttempt } );

			const { getNotificationData } = require( '../src/github' );
			const actual = await getNotificationData( isFailure );

			expect( actual.text ).toBe( expected.text );
		}
	);
} );
