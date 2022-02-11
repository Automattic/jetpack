import { execSyncShellCommand, resolveSiteUrl } from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { test } from '@playwright/test';

test( 'Update Jetpack plugin via CLI', async () => {
	execSyncShellCommand( `./bin/update/update-flow.sh ${ resolveSiteUrl() }` );
} );
