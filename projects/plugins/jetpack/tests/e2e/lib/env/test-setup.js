import logger from '../logger';
import { prerequisites } from './prerequisites';

export const step = async ( stepName, fn ) => {
	logger.step( `Step: ${ stepName }` );
	await fn();
};

beforeAll( async () => {
	await prerequisites( { loggedIn: true, wpComLoggedIn: true } );
} );
