import { doesRepoExist } from '../../../helpers/github.js';

describe( 'doesRepoExist Unit Tests', () => {
	test( 'should be a function', () => {
		expect( doesRepoExist ).toBeInstanceOf( Function );
	} );
} );
