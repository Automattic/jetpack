const express = require( 'express' );

const index = `
	<!DOCTYPE html>
	<html>
		<head>
			<script src="./bundle.js"></script>
		</head>
	</html>
`;

/**
 * Test server , used to test client-side / iframe version of Critical CSS generation.
 */
class TestServer {
	constructor( staticPaths ) {
		this.port = null;
		this.app = null;
		this.server = null;
		this.staticPaths = staticPaths || [];
	}

	async start() {
		this.app = express();

		this.app.use(
			'/bundle.js',
			express.static( require.resolve( '../../build-browser/bundle.full.js' ) )
		);

		for ( const [ virtualPath, realDirectory ] of Object.entries( this.staticPaths ) ) {
			this.app.use( '/' + virtualPath, express.static( realDirectory ) );
		}

		this.app.use( '/', ( req, res ) => res.send( index ) );

		return new Promise( resolve => {
			this.server = this.app.listen( () => {
				this.port = this.server.address().port;
				resolve();
			} );
		} );
	}

	async stop() {
		if ( this.app && this.server ) {
			this.server.close();
		}
	}

	getUrl() {
		return 'http://localhost:' + this.port;
	}
}

module.exports = TestServer;
