import { createRequire } from 'module';
import path from 'path';

const chalk = createRequire( import.meta.url )
	.resolve( 'chalk' )
	.replace( /\/chalk\/.*?$/, '/chalk/' );

export default {
	// https://github.com/facebook/jest/issues/12270
	moduleNameMapper: {
		'#ansi-styles': path.join( chalk, 'source/vendor/ansi-styles/index.js' ),
		'#supports-color': path.join( chalk, 'source/vendor/supports-color/index.js' ),
	},
};
