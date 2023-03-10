/**
 * Webpack plugin to avoid emitting certain assets.
 */
const debug = require( 'debug' )( '@automattic/remove-asset-webpack-plugin' );
const webpack = require( 'webpack' );

const PLUGIN_NAME = 'RemoveAsset';

const schema = {
	definitions: {
		AssetFilter: {
			description: 'Filter for assets to remove.',
			anyOf: [
				{
					instanceof: 'RegExp',
					tsType: 'RegExp',
				},
				{
					type: 'string',
					absolutePath: false,
				},
				{
					instanceof: 'Function',
					tsType: '((name: string, asset: object) => boolean)',
				},
			],
		},
	},
	title: 'RemoveAsset plugin options',
	type: 'object',
	additionalProperties: false,
	properties: {
		assets: {
			description: 'Assets to remove',
			anyOf: [
				{
					$ref: '#/definitions/AssetFilter',
				},
				{
					type: 'array',
					items: {
						$ref: '#/definitions/AssetFilter',
					},
				},
			],
		},
	},
};

module.exports = class RemoveAssetPlugin {
	constructor( options = {} ) {
		webpack.validateSchema( schema, options, {
			name: 'RemoveAsset plugin',
			baseDataPath: 'options',
		} );

		this.filters = ( Array.isArray( options.assets ) ? options.assets : [ options.assets ] ).map(
			filter => {
				if ( typeof filter === 'string' ) {
					return {
						func: name => name === filter,
						desc: `"${ filter }"`,
					};
				}
				if ( filter instanceof RegExp ) {
					return {
						func: name => filter.test( name ),
						desc: filter,
					};
				}
				return {
					func: filter,
					desc: filter,
				};
			}
		);
	}

	apply( compiler ) {
		compiler.hooks.thisCompilation.tap( PLUGIN_NAME, compilation => {
			compilation.hooks.processAssets.tap(
				{
					name: PLUGIN_NAME,
					stage: webpack.Compilation.PROCESS_ASSETS_STAGE_OPTIMIZE_INLINE,
					additionalAssets: true,
				},
				assets => {
					assets: for ( const [ name, asset ] of Object.entries( assets ) ) {
						for ( const filter of this.filters ) {
							if ( filter.func( name, asset ) ) {
								debug( `Removing asset ${ name } due to match with ${ filter.desc }` );
								delete assets[ name ];
								continue assets;
							}
						}
					}
				}
			);
		} );
	}
};
