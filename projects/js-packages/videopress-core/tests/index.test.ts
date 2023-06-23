// We recommend using `jest` for testing. If you're testing React code, we recommend `@testing-library/react` and related packages.
// Please match the versions used elsewhere in the monorepo.
//
// Please don't add new uses of `mocha`, `chai`, `sinon`, `enzyme`, and so on. We're trying to standardize on one testing framework.
//
// The default setup is to have files named like "name.test.js" (or .jsx, .ts, or .tsx) in this `tests/` directory.
// But you could instead put them in `src/`, or put files like "name.js" (or .jsx, .ts, or .tsx) in `test` or `__tests__` directories somewhere.

import { addition } from '../src/index';

describe( 'Blank Test', () => {
	it( 'is a noop', () => {
		expect( true ).toBe( true );
	} );

	it( 'addition works', () => {
		expect( addition( 1, 2 ) ).toBe( 3 );
	} );
} );
