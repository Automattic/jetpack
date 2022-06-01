import chai from 'chai';
import { doesRepoExist } from '../../../helpers/github.js';

describe( 'doesRepoExist Unit Tests', function () {
	it( 'should be a function', function () {
		chai.expect( doesRepoExist ).to.be.an( 'function' );
	} );
} );
