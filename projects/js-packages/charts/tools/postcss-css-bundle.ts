import postcss from 'postcss';
import { type TsdownPlugin } from 'tsdown';
import postcssConfig from '../postcss.config.js';

/**
 * Run PostCSS (DS token fallbacks + autoprefixer) on emitted CSS assets.
 *
 * tsdown's `css.transformer: 'postcss'` cannot resolve `postcss-modules` under
 * pnpm's isolation (tsdown dynamically imports it from its own package root).
 * Keeping the default lightningcss transformer preserves CSS modules; this
 * plugin injects official `--wpds-*` fallbacks into the final CSS bundle.
 *
 * Uses `order: 'post'` so it runs after `@tsdown/css` emits the CSS asset.
 *
 * @return {TsdownPlugin} The tsdown plugin.
 */
export function postcssCssBundle(): TsdownPlugin {
	return {
		name: 'postcss-css-bundle',
		generateBundle: {
			order: 'post',
			async handler( _options, bundle ) {
				const { plugins } = postcssConfig();
				await Promise.all(
					Object.values( bundle ).map( async file => {
						if ( file.type !== 'asset' || ! file.fileName.endsWith( '.css' ) ) {
							return;
						}
						const source =
							typeof file.source === 'string'
								? file.source
								: Buffer.from( file.source ).toString( 'utf8' );
						if ( ! source.includes( '--wpds-' ) ) {
							return;
						}
						const result = await postcss( plugins ).process( source, { from: undefined } );
						file.source = result.css;
					} )
				);
			},
		},
	};
}
