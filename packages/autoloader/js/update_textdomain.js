const wpTextdomain = require( 'wp-textdomain' );

const textDomain = process.argv[ 2 ];

wpTextdomain( './vendor/automattic/**/*.php', {
	domain: textDomain,
	fix: true,
	glob: { follow: true },
} );
