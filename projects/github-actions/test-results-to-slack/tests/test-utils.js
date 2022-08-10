const github = require( '@actions/github' );

/**
 * Mocks the GitHub context
 *
 * @param {object} value - context object
 */
function mockGitHubContext( value ) {
	Object.defineProperty( github, 'context', {
		value,
	} );
}

/**
 * Set the input data required by the action to run
 *
 * @param {object} options - options object
 */
function setInputData( options ) {
	const {
		ghToken = 'token',
		slackToken = 'token',
		slackChannel = '123ABC',
		slackUsername = 'Reporter',
		slackIconEmoji = ':bot:',
		repo = 'foo/bar',
	} = options;
	process.env.INPUT_GITHUB_TOKEN = ghToken;
	process.env.INPUT_SLACK_TOKEN = slackToken;
	process.env.INPUT_SLACK_CHANNEL = slackChannel;
	process.env.INPUT_SLACK_USERNAME = slackUsername;
	process.env.INPUT_SLACK_ICON_EMOJI = slackIconEmoji;
	process.env.GITHUB_REPOSITORY = repo;
}

module.exports = {
	mockGitHubContext,
	setInputData,
};
