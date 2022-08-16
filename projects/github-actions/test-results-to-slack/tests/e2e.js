const nock = require( 'nock' );
const { mockGitHubContext } = require( './test-utils' );
process.env.INPUT_GITHUB_TOKEN = 'token';
const sha = '5dc6ab9d13d9b79317b719a32a60cc682cd6930dx';
const ref_name = 'trunk';
const ref_type = 'branch';
const repo = 'foo/bar';
const commitId = '5dc6ab9d13d9b79317b719a32a60cc682cd6930dx';
const commitURL = `https://github.com/commit/${ commitId }`;
const prNumber = '1234';
const prUrl = `https://github.com/foo/bar/pull/${ prNumber }`;
const prTitle = 'Pull request title';
const repository = { owner: { login: 'foo' }, name: 'bar' };
const runId = '12345756096';

( async function main() {
	// Pull request
	// await run({
	// 	payload: {
	// 		repository,
	// 		pull_request: { html_url: prUrl, number: prNumber, title: prTitle },
	// 	},
	// 	eventName: 'pull_request',
	// 	runId
	// },[ { status: "completed",conclusion: 'success' } ] );

	// Push
	await run(
		{
			payload: {
				repository,
				head_commit: {
					url: commitURL,
					id: commitId,
					author: { name: 'John Doe' },
					message: 'Commit message (#ddsc)',
				},
			},
			eventName: 'push',
			ref_name,
			ref_type,
			sha,
			runId,
		},
		[ { status: 'completed', conclusion: 'failed' } ]
	);

	// Schedule
	// await run({
	// 	payload: {
	// 		repository,
	// 	},
	// 	eventName: 'schedule',
	// 	ref_name,
	// 	ref_type,
	// 	sha,
	// 	runId
	// },[ { status: "completed",conclusion: 'failed' } ] );
} )();

/**
 * @param context
 * @param workflowJobs
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
