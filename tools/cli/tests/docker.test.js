/**
 * External dependencies
 */
import chai from 'chai';

/**
 * Internal dependencies
 */
import { testable } from "../commands/docker";

const { dockerOptionsFalse, dockerOptionsTrue } = testable;

describe( 'docker', function() {
	it( 'dockerOptions should return expected options when passed false (default)', function() {
		commonDockerOptions( dockerOptionsFalse );
		chai.expect( dockerOptionsFalse.log ).to.be.false;
	} );

	it( 'dockerOptions should return expected options when passed true', function() {
		commonDockerOptions( dockerOptionsTrue );
		chai.expect( dockerOptionsTrue.log ).to.be.true;
	} );
} );

function commonDockerOptions( dockerOptionsVariant ) {
	chai.expect( dockerOptionsVariant ).to.be.an('object' );
	chai.expect( dockerOptionsVariant.cwd ).to.be.contain('tools/docker' );
	chai.expect( dockerOptionsVariant.config ).to.have.members(['docker-compose.yml', 'compose-volumes.built.yml', 'compose-extras.yml'] );
}
