const github = require( '@actions/github' );

/**
 * Mocks the GitHub context exposed by `@actions/github`
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
		ghToken,
		slackToken,
		slackChannel,
		slackUsername,
		slackIconEmoji,
		suiteName,
		rulesConfigurationPath,
	} = options;

	if ( ghToken ) {
		process.env.INPUT_GITHUB_TOKEN = ghToken;
	}

	if ( slackToken ) {
		process.env.INPUT_SLACK_TOKEN = slackToken;
	}

	if ( slackChannel ) {
		process.env.INPUT_SLACK_CHANNEL = slackChannel;
	}

	if ( slackUsername ) {
		process.env.INPUT_SLACK_USERNAME = slackUsername;
	}

	if ( slackIconEmoji ) {
		process.env.INPUT_SLACK_ICON_EMOJI = slackIconEmoji;
	}

	if ( suiteName ) {
		process.env.INPUT_SUITE_NAME = suiteName;
	}

	if ( rulesConfigurationPath ) {
		process.env.INPUT_RULES_CONFIGURATION_PATH = rulesConfigurationPath;
	}
}

/**
 * The context exposed by `@actions/github` is missing some properties that we need.
 * This function sets those env variables that we use to fill the missing properties.
 *
 * @param {object} options - options object
 */
function mockContextExtras( options ) {
	const {
		runAttempt = '1',
		refType = 'branch',
		refName = 'trunk',
		repository = 'foo/bar',
		triggeringActor = 'the-other-octocat',
	} = options;

	process.env.GITHUB_RUN_ATTEMPT = runAttempt;
	process.env.GITHUB_REF_TYPE = refType;
	process.env.GITHUB_REF_NAME = refName;
	process.env.GITHUB_REPOSITORY = repository;
	process.env.GITHUB_TRIGGERING_ACTOR = triggeringActor;
}

module.exports = {
	mockGitHubContext,
	setInputData,
	mockContextExtras,
};
