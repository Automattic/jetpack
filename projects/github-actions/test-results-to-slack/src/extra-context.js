const extras = {
	runAttempt: process.env.GITHUB_RUN_ATTEMPT,
	refType: process.env.GITHUB_REF_TYPE,
	refName: process.env.GITHUB_REF_NAME,
	repository: process.env.GITHUB_REPOSITORY,
	triggeringActor: process.env.GITHUB_TRIGGERING_ACTOR,
};

module.exports = extras;
