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
	constructor( staticPaths, delays ) {
		this.port = null;
		this.app = null;
		this.server = null;
		this.staticPaths = staticPaths || [];
		// Milliseconds to hold each virtual path's page before serving it.
		this.delays = delays || {};
	}

	async start() {
		this.app = express();

		this.app.use( '/bundle.js', express.static( require.resolve( '../build/bundle.js' ) ) );

		for ( const [ virtualPath, realDirectory ] of Object.entries( this.staticPaths ) ) {
			const delay = this.delays[ virtualPath ];
			if ( delay ) {
				// Hold the page itself, not its stylesheets, so the delay is the page's load time.
				this.app.use( '/' + virtualPath, ( req, res, next ) =>
					req.path === '/' || req.path.endsWith( '.html' ) ? setTimeout( next, delay ) : next()
				);
			}
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
