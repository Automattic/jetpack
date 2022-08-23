const { mockGitHubContext, mockContextExtras, setInputData } = require( './test-utils' );

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
	afterEach( () => {
		delete process.env.INPUT_SUITE_NAME;
	} );

	test.each`
		eventName           | isFailure  | suiteName         | expected
		${ 'push' }         | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed on ${ refType } _*${ refName }*_` } }
		${ 'push' }         | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed on ${ refType } _*${ refName }*_` } }
		${ 'push' }         | ${ true }  | ${ 'suite name' } | ${ { text: `:x:	_*suite name*_ tests failed on ${ refType } _*${ refName }*_` } }
		${ 'schedule' }     | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'schedule' }     | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'schedule' }     | ${ true }  | ${ 'test-suite' } | ${ { text: `:x:	_*test-suite*_ tests failed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'schedule' }     | ${ true }  | ${ '' }           | ${ { text: `:x:	Tests failed for scheduled run on ${ refType } _*${ refName }*_` } }
		${ 'pull_request' } | ${ false } | ${ undefined }    | ${ { text: `:white_check_mark:	Tests passed for pull request *#${ prNumber }*` } }
		${ 'pull_request' } | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed for pull request *#${ prNumber }*` } }
		${ 'unsupported' }  | ${ true }  | ${ undefined }    | ${ { text: `:x:	Tests failed for ${ sha }` } }
	`(
		`Message text is correct for $eventName and workflow failed=$isFailure and suiteName=$suiteName`,
		async ( { eventName, isFailure, suiteName, expected } ) => {
			setInputData( { suiteName } );

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
