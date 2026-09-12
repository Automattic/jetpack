import postcssDsTokenFallbacks from '@wordpress/theme/postcss-plugins/postcss-ds-token-fallbacks';
import autoprefixer from 'autoprefixer';

export default () => ( {
	plugins: [ postcssDsTokenFallbacks, autoprefixer ],
} );
