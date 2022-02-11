import {
	execSyncShellCommand,
	BASE_DOCKER_CMD,
	resolveSiteUrl,
} from 'jetpack-e2e-commons/helpers/utils-helper.cjs';
import { test } from '@playwright/test';

test( 'Update Jetpack plugin via CLI', async () => {
	execSyncShellCommand(
		`${ BASE_DOCKER_CMD } -v exec-silent /usr/local/src/jetpack-monorepo/projects/plugins/jetpack/tests/e2e/bin/update/update-flow.sh ${ resolveSiteUrl() }`
	);
} );
