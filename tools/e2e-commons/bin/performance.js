import { prerequisitesBuilder } from '../env/prerequisites.js';
import { execSyncShellCommand, execWpCommand, resolveSiteUrl } from '../helpers/utils-helper.cjs';

function envReset() {
	console.log( execSyncShellCommand( 'pwd' ) );
	execSyncShellCommand( 'pnpm env:reset' );
	execSyncShellCommand( 'pnpm tunnel:reset' );
}

async function envSetup( type ) {
	if ( type === 'base' ) {
		await execWpCommand( 'plugin deactivate jetpack' );
	} else if ( type === 'jetpack' ) {
		await prerequisitesBuilder().withConnection( true ).build();
		await execWpCommand( 'jetpack module deactivate sso' );
	}

	await execWpCommand(
		'user create admin admin@example.com --role=administrator --user_pass=password'
	);
}

function runTests( type ) {
	const siteUrl = resolveSiteUrl();

	execSyncShellCommand( `export WP_BASE_URL=${ siteUrl } &&
	cd ../../gutenberg &&
	echo $WP_BASE_URL &&
	WP_BASE_URL=${ siteUrl } npm run test-performance packages/e2e-tests/specs/performance/post-editor.test.js &&
	mv packages/e2e-tests/specs/performance/post-editor.test.results.json ../tools/e2e-commons/results/${ type }.test.results.json` );
}

async function main() {
	envReset();
	await envSetup( process.argv[ 2 ] );
	runTests( process.argv[ 2 ] );
}

main().then( () => console.log( 'Done!' ) );
