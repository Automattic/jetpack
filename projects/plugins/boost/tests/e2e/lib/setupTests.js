import { prerequisitesBuilder } from 'jetpack-e2e-commons/env/prerequisites';
import { boostPrerequisitesBuilder } from './env/prerequisites';

global.beforeAll( async () => {
	await prerequisitesBuilder().withLoggedIn( true ).withInactivePlugins( [ 'jetpack' ] ).build();
	await boostPrerequisitesBuilder().withConnection( true ).build();
} );
