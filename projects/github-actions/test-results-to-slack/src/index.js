const { setFailed, getInput } = require( '@actions/core' );
const { context } = require( '@actions/github' );

( async function main() {
	const token = getInput( 'github_token' );
	if ( ! token ) {
		setFailed( 'main: Input `github_token` is required' );
		return;
	}

	process.stdout.write(
		`Received event = '${ context.eventName }', action = '${ context.payload.action }'`
	);
} )();
