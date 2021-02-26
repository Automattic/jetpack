module.exports = {
	/* Replace relative paths with new paths */
	transformRelativePath: function ( relPath, filepath ) {
		// If wrapped in singly quotes, strip them
		if ( 0 === relPath.indexOf( "'" ) ) {
			relPath = relPath.substr( 1, relPath.length - 2 );
		}

		// Return the path unmodified if not relative
		if ( ! ( 0 === relPath.indexOf( './' ) || 0 === relPath.indexOf( '../' ) ) ) {
			return relPath;
		}

		// The concat file is in jetpack/css/jetpack.css, so to get to the root we
		// have to go back one dir
		const relPieces = relPath.split( '/' ),
			filePieces = filepath.split( '/' );

		filePieces.pop(); // Pop the css file name

		if ( '.' === relPieces[ 0 ] ) {
			relPieces.shift();
		}

		while ( '..' === relPieces[ 0 ] ) {
			relPieces.shift();
			filePieces.pop();
		}

		return '../' + filePieces.join( '/' ) + '/' + relPieces.join( '/' );
	},
};
