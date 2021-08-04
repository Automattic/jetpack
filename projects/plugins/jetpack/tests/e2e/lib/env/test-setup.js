import logger from '../logger';
import { prerequisitesBuilder } from './prerequisites';

export const step = async ( stepName, fn ) => {
	logger.step( `Step: ${ stepName }` );
	await fn();
};

beforeAll( async () => {
	await prerequisitesBuilder().withLoggedIn( true ).withWpComLoggedIn( true ).build();
} );
