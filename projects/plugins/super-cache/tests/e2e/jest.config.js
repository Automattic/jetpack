import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Read .env file so variables are available in tests.
const __filename = fileURLToPath( import.meta.url );
dotenv.config( { path: path.join( path.dirname( __filename ), '.env' ) } );

export default {
	preset: 'ts-jest',
};
