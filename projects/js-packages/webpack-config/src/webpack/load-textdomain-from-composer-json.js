const fs = require( 'fs' );
const path = require( 'path' );

let cachedDomain;
const loadTextDomainFromComposerJson = () => {
	if ( cachedDomain !== undefined ) {
		return cachedDomain;
	}

	let dir = process.cwd(),
		olddir,
		ret;
	do {
		const file = path.join( dir, 'composer.json' );
		if ( fs.existsSync( file ) ) {
			const cfg = JSON.parse( fs.readFileSync( file, { encoding: 'utf8' } ) );
			if ( cfg.extra ) {
				if ( cfg.extra.textdomain ) {
					ret = cfg.extra.textdomain;
				} else if ( cfg.extra[ 'wp-plugin-slug' ] ) {
					ret = cfg.extra[ 'wp-plugin-slug' ];
				} else if ( cfg.extra[ 'beta-plugin-slug' ] ) {
					ret = cfg.extra[ 'beta-plugin-slug' ];
				}
			}
			break;
		}

		olddir = dir;
		dir = path.dirname( dir );
	} while ( dir !== olddir );

	cachedDomain = ret;

	return ret;
};

module.exports = loadTextDomainFromComposerJson;
