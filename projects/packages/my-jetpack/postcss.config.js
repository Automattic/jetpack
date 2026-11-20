import postcssDsTokenFallbacks from '@wordpress/theme-build-tools/postcss-plugins/postcss-ds-token-fallbacks';
import autoprefixer from 'autoprefixer';

export default () => ( {
	plugins: [ postcssDsTokenFallbacks, autoprefixer ],
} );
