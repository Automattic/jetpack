import fsp from 'fs/promises';
import pathLib from 'path';
import { readDockerFile, writeDockerFile } from './docker-tools';

export type ConfigValue = boolean | string | number | Array< ConfigValue >;

/**
 * Returns the absolute path of a file in the plugin directory.
 *
 * @param {string} path - The path to the file, relative to the plugin directory.
 * @returns {string} The absolute path to the file.
 */
export function pluginFilePath( path: string ) {
	return pathLib.join( __dirname, '../../../', path );
}

/**
 * Returns the contents of the specified file from the plugin directory.
 *
 * @param {string} path - The path to the file, relative to the plugin directory.
 * @returns {string} The contents of the file. Assumed to be utf8.
 */
export async function readPluginFile( path: string ): Promise< string > {
	return fsp.readFile( pluginFilePath( path ), 'utf8' );
}

/**
 * Updates the specified values in the super-cache config file.
 *
 * @param {Object} values - Values to overwrite. Booleans, strings and numbers get output in JSON format. Arrays get array()-ified.
 */
export async function setConfigValues( values: Record< string, ConfigValue > ): Promise< void > {
	const configFile = '/var/www/html/wp-content/wp-cache-config.php';
	let data = await readDockerFile( configFile );

	for ( const [ key, value ] of Object.entries( values ) ) {
		const pattern = new RegExp( `^\\s*\\$${ key }\\s*=.*$`, 'gm' );

		data = data.replace( pattern, `$${ key } = ${ formatConfigValue( value ) };` );
	}

	await writeDockerFile( configFile, Buffer.from( data ) );
}

/**
 * Formats a config value for output in a config file (PHP).
 *
 * @param {ConfigValue} value - Value to format
 * @returns {string} The formatted value.
 */
function formatConfigValue( value: ConfigValue ): string {
	if ( Array.isArray( value ) ) {
		return `array( ${ value.map( formatConfigValue ).join( ', ' ) } )`;
	}

	if ( typeof value === 'string' ) {
		return `"${ value }"`;
	}

	return value.toString();
}
