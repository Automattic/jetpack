import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites';

global.beforeAll( async () => {
	await prerequisitesBuilder().withLoggedIn( true ).withConnection( true ).build();
} );
