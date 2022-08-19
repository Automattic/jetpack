const { mockGitHubContext, setInputData } = require( './test-utils' );

const sha = '12345abcd';
const refName = 'trunk';
const refType = 'branch';
const repo = 'foo/bar';
const commitId = '123';
const commitURL = `https://github.com/commit/${ commitId }`;
const prNumber = '123';
const prUrl = `https://github.com/foo/bar/pull/${ prNumber }`;
const prTitle = 'Pull request title';
const runId = '123456789';
const actor = 'octocat';
const triggeringActor = 'another-octocat';

beforeAll( () => {
	setInputData( { repo } );
} );

describe( 'Notification text', () => {
	test.each`
		event               | isFailure  | expected
		${ 'push' }         | ${ false } | ${ { text: `Tests passed on ${ refType } *${ refName }*` } }
		${ 'push' }         | ${ true }  | ${ { text: `Tests failed on ${ refType } *${ refName }*` } }
		${ 'schedule' }     | ${ false } | ${ { text: `Tests passed for scheduled run on ${ refType } *${ refName }*` } }
		${ 'schedule' }     | ${ true }  | ${ { text: `Tests failed for scheduled run on ${ refType } *${ refName }*` } }
		${ 'pull_request' } | ${ false } | ${ { text: `Tests passed for pull request *#${ prNumber }*` } }
		${ 'pull_request' } | ${ true }  | ${ { text: `Tests failed for pull request *#${ prNumber }*` } }
		${ 'unsupported' }  | ${ true }  | ${ { text: `Tests failed for ${ sha }` } }
	`(
		`Message text is correct for $event event and workflow failed=$isFailure`,
		async ( { event, isFailure, expected } ) => {
			// Mock GitHub context
			await mockGitHubContext( {
				payload: {
					head_commit: { url: commitURL, id: '123' },
					pull_request: { html_url: prUrl, number: prNumber, title: prTitle },
				},
				sha,
				eventName: event,
				runId,
				actor,
			} );
			process.env.GITHUB_RUN_ATTEMPT = '1';
			process.env.GITHUB_REF_TYPE = refType;
			process.env.GITHUB_REF_NAME = refName;
			process.env.GITHUB_REPOSITORY = repo;
			process.env.GITHUB_TRIGGERING_ACTOR = triggeringActor;

			const { getNotificationData } = require( '../src/github' );
			const actual = await getNotificationData( isFailure );

			expect( actual.text ).toBe( expected.text );
		}
	);
} );
