import { prerequisitesBuilder } from 'jetpack-e2e-tests/lib/env/prerequisites';

global.beforeAll( async () => {
	await prerequisitesBuilder().withLoggedIn( true ).withConnection( true ).build();
} );
