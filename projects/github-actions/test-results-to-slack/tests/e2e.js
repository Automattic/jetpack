const nock = require( 'nock' );
const { mockGitHubContext } = require( './test-utils' );
process.env.INPUT_GITHUB_TOKEN = 'token';
const sha = '5dc6ab9d13d9b79317b719a32a60cc682cd6930d';
const ref_name = 'trunk';
const ref_type = 'branch';
const repo = 'foo/bar';
const commitId = '5dc6ab9d13d9b79317b719a32a60cc682cd6930d';
const commitURL = `https://github.com/commit/${ commitId }`;
const prNumber = '1234';
const prUrl = `https://github.com/foo/bar/pull/${ prNumber }`;
const prTitle = 'Pull request title';
const repository = { owner: { login: 'foo' }, name: 'bar' };
const run_id = '12345756096';
const run_attempt = '3';
const server_url = 'https://github.com';
const actor = 'octocat';
const triggering_actor = 'another_octocat';

( async function main() {
	// Pull request
	await run(
		{
			payload: {
				repository,
				pull_request: { html_url: prUrl, number: prNumber, title: prTitle },
			},
			eventName: 'pull_request',
			run_id,
			run_attempt,
			repository: repo,
			server_url,
			actor,
			triggering_actor,
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
			ref_name,
			ref_type,
			sha,
			run_id,
			run_attempt,
			repository: repo,
			server_url,
			actor,
			triggering_actor,
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
			ref_name,
			ref_type,
			sha,
			run_id,
			run_attempt,
			repository: repo,
			triggering_actor,
			server_url,
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
		.get( `/repos/${ repo }/actions/runs/${ run_id }/jobs` )
		.reply( 200, {
			jobs: workflowJobs,
		} );

	// Run the action
	require( '../src/index' );
}
