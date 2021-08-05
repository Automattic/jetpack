import { prerequisitesBuilder } from './prerequisites';

beforeAll( async () => {
	await prerequisitesBuilder().withLoggedIn( true ).withWpComLoggedIn( true ).build();
} );
