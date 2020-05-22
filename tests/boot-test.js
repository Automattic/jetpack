require( 'babel-core/register' );
const Chai = require( 'chai' ),
	sinonChai = require( 'sinon-chai' ),
	sinon = require( 'sinon' ),
	nock = require( 'nock' );

module.exports = {
	before: function() {
		Chai.use( sinonChai );
		sinon.assert.expose( Chai.assert, { prefix: '' } );
		nock.disableNetConnect();
	},
	after: function() {
		nock.cleanAll();
		nock.enableNetConnect();
		nock.restore();
	}
};
