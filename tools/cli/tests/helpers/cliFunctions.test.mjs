/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import { cliFunctions } from "../../helpers/cliFunctions.mjs";
const cli = cliFunctions();

describe( 'cliFunctions', function() {
	it( 'should be an object', function() {
		chai.expect( cli ).to.be.an( 'object' );
	} );
	it( 'should have two default options', function() {
		chai.expect( cli.details.options ).to.have.length( 2 );
	} );
} );

