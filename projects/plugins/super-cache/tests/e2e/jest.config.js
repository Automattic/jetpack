import { fileURLToPath } from 'url';
import * as dotenv from 'dotenv';

// Read .env file so variables are available in tests.
dotenv.config( { path: fileURLToPath( '.env', import.meta.url ) } );

export default {
	preset: 'ts-jest',
	testTimeout: 10000,
};
