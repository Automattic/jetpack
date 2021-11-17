const { E2E_TIMEOUT, E2E_DEBUG, E2E_RETRY_TIMES } = process.env;

// The Jest timeout is increased because these tests are a bit slow
jest.setTimeout( E2E_TIMEOUT || 300000 );
if ( E2E_DEBUG ) {
	jest.setTimeout( 2147483647 ); // max 32-bit signed integer
}

jest.retryTimes( parseInt( E2E_RETRY_TIMES ) || 0 );
