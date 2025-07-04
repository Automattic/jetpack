import { fileURLToPath } from 'url';
import { config as dotenvConfig } from 'dotenv';

// Read .env file so variables are available in tests.
dotenvConfig( { path: fileURLToPath( '.env', import.meta.url ) } );

export default {
	preset: 'ts-jest',
	testTimeout: 10000,
};
