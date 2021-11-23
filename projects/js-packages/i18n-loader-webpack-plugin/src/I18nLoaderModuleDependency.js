const webpack = require( 'webpack' );

/**
 * Dependency class.
 *
 * Webpack requires a Dependency subclass to idenitfy modules to build and to locate
 * the built modules, and doesn't provide a usable generic class of its own.
 */
class I18nLoaderModuleDependency extends webpack.dependencies.ModuleDependency {}

module.exports = I18nLoaderModuleDependency;
