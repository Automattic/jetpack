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
		playwrightReportPath,
		playwrightOutputDir,
	} = options;

	if ( ghToken ) {
		process.env.INPUT_GITHUB_TOKEN = ghToken;
	} else {
		delete process.env.INPUT_GITHUB_TOKEN;
	}

	if ( slackToken ) {
		process.env.INPUT_SLACK_TOKEN = slackToken;
	} else {
		delete process.env.INPUT_SLACK_TOKEN;
	}

	if ( slackChannel ) {
		process.env.INPUT_SLACK_CHANNEL = slackChannel;
	} else {
		delete process.env.INPUT_SLACK_CHANNEL;
	}

	if ( slackUsername ) {
		process.env.INPUT_SLACK_USERNAME = slackUsername;
	} else {
		delete process.env.INPUT_SLACK_USERNAME;
	}

	if ( slackIconEmoji ) {
		process.env.INPUT_SLACK_ICON_EMOJI = slackIconEmoji;
	} else {
		delete process.env.INPUT_SLACK_ICON_EMOJI;
	}

	if ( suiteName ) {
		process.env.INPUT_SUITE_NAME = suiteName;
	} else {
		delete process.env.INPUT_SUITE_NAME;
	}

	if ( rulesConfigurationPath ) {
		process.env.INPUT_RULES_CONFIGURATION_PATH = rulesConfigurationPath;
	} else {
		delete process.env.INPUT_RULES_CONFIGURATION_PATH;
	}

	if ( playwrightReportPath ) {
		process.env.INPUT_PLAYWRIGHT_REPORT_PATH = playwrightReportPath;
	} else {
		delete process.env.INPUT_PLAYWRIGHT_REPORT_PATH;
	}

	if ( playwrightOutputDir ) {
		process.env.INPUT_PLAYWRIGHT_OUTPUT_DIR = playwrightOutputDir;
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
