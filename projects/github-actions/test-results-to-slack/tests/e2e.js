const nock = require( 'nock' );
const { mockGitHubContext } = require( './test-utils' );
process.env.INPUT_GITHUB_TOKEN = 'token';
const sha = '5dc6ab9d13d9b79317b719a32a60cc682cd6930d';
const refName = 'trunk';
const refType = 'branch';
const repo = 'foo/bar';
const commitId = '5dc6ab9d13d9b79317b719a32a60cc682cd6930d';
const commitURL = `https://github.com/commit/${ commitId }`;
const prNumber = '1234';
const prUrl = `https://github.com/foo/bar/pull/${ prNumber }`;
const prTitle = 'Pull request title';
const repository = { owner: { login: 'foo' }, name: 'bar' };
const runId = '12345756096';
const runAttempt = '3';
const serverUrl = 'https://github.com';
const actor = 'octocat';
const triggeringActor = 'another-octocat';

( async function main() {
	process.env.GITHUB_RUN_ATTEMPT = runAttempt;
	process.env.GITHUB_REF_TYPE = refType;
	process.env.GITHUB_REF_NAME = refName;
	process.env.GITHUB_REPOSITORY = repo;
	process.env.GITHUB_TRIGGERING_ACTOR = triggeringActor;

	// Pull request
	await run(
		{
			payload: {
				repository,
				pull_request: { html_url: prUrl, number: prNumber, title: prTitle },
			},
			eventName: 'pull_request',
			runId,
			serverUrl,
			actor,
		},
		[ { status: 'completed', conclusion: 'failed' } ]
	);

	// Push
	await run(
		{
			payload: {
				repository,
				head_commit: {
					url: commitURL,
					id: commitId,
					message: 'Commit message (#ddsc)',
				},
			},
			eventName: 'push',
			sha,
			runId,
			serverUrl,
			actor,
		},
		[ { status: 'completed', conclusion: 'failed' } ]
	);

	// Schedule
	await run(
		{
			payload: {
				repository,
			},
			eventName: 'schedule',
			sha,
			runId,
			serverUrl,
		},
		[ { status: 'completed', conclusion: 'failed' } ]
	);
} )();

/**
 * Run the actions with the given context
 *
 * @param {object} context - the GitHub context with relevant properties
 * @param {Array} workflowJobs - an array with workflow jobs objects. E.g. `[ { status: 'completed', conclusion: 'failed' } ]`
 */
async function run( context, workflowJobs ) {
	// Mock GitHub context
	await mockGitHubContext( context );

	// Intercept request to GitHub Api and mock response
	nock( 'https://api.github.com' )
		.get( `/repos/${ repo }/actions/runs/${ runId }/jobs` )
		.reply( 200, {
			jobs: workflowJobs,
		} );

	// Run the action
	require( '../src/index' );
}
