import { readFileSync, writeFileSync, existsSync } from 'fs';
import path from 'path';
import chalk from 'chalk';
import yaml from 'js-yaml';

export const dockerFolder = `tools/docker`;
const overrideConfigFile = `${ dockerFolder }/jetpack-docker-config.yml`;
const defaultConfigFile = `${ dockerFolder }/jetpack-docker-config-default.yml`;

/**
 * Recursively merges two plain JSON objects. It would not work on complex objects, circular links, etc.
 *
 * @param {object} a - First object
 * @param {object} b - Second object
 * @returns {object} Merged object
 */
function mergeJson( a, b ) {
	if ( a instanceof Object && b instanceof Object && Array.isArray( a ) === Array.isArray( b ) ) {
		const ret = Array.isArray( a ) ? [ ...a ] : { ...a };
		for ( const k of Object.keys( b ) ) {
			ret[ k ] = mergeJson( ret[ k ], b[ k ] );
		}
		return ret;
	}

	if ( b === null ) {
		return a;
	}

	return b;
}

/**
 * Merges two arrays of volume mappings, comparing only local paths of the mapping.
 *
 * @param {Array} mainMapping - array of default volume mappings
 * @param {Array} overrideMapping - array of override volume mappings
 * @returns {Array} merged array.
 */
function mergeDockerVolumeMappings( mainMapping, overrideMapping ) {
	const map = {};
	mainMapping.forEach( v => ( map[ v.split( ':' )[ 0 ] ] = v ) );
	overrideMapping.forEach( v => ( map[ v.split( ':' )[ 0 ] ] = v ) );
	return Object.values( map );
}

/**
 * Parses deprecated compose-volumes.yml and adds its contents into docker config.
 *
 * @param {object} config - Docker configuration
 * @returns {object} config
 */
const getDeprecatedVolumesMapping = config => {
	const volumesFile = `${ dockerFolder }/compose-volumes.yml`;
	if ( ! existsSync( volumesFile ) ) {
		return config;
	}

	const volumes = yaml.load( readFileSync( volumesFile, 'utf8' ) );
	console.warn(
		chalk.yellow(
			`[WARNING] Using configuration defined in ${ volumesFile }. This approach in deprecated in favor of 'jetpack-docker-config.yml'. This configuration method will be removed in a future version`
		)
	);

	// convert array of docker volumes into a object of local/docker paths
	const volumesObj = volumes.reduce( ( acc, volume ) => {
		const [ localPath, dockerPath ] = volume.split( ':' );
		let relPath = path.relative( '.', path.resolve( dockerFolder, localPath ) );
		if ( ! relPath ) {
			relPath = '.';
		}
		acc[ relPath ] = dockerPath;
		return acc;
	}, {} );

	return mergeJson( config, { dev: { volumeMappings: volumesObj } } );
};

/**
 * Parses deprecated compose-extras.yml and adds its contents into docker config.
 *
 * @param {object} config - Docker configuration
 * @returns {object} config
 */
const getDeprecatedExtras = config => {
	const extrasFile = `${ dockerFolder }/compose-extras.yml`;
	if ( ! existsSync( extrasFile ) ) {
		return config;
	}

	const extras = yaml.load( readFileSync( extrasFile, 'utf8' ) );
	console.warn(
		chalk.yellow(
			`[WARNING] Using configuration defined in ${ extrasFile }. This approach in deprecated in favor of 'jetpack-docker-config.yml'. This configuration method will be removed in a future version`
		)
	);
	delete extras.version;

	return mergeJson( config, { dev: { extras: extras } } );
};

/**
 * Compose a config object using multiple sources.
 * To keep the backward compatibility, it pulls configuration from compose-volumes and compose-extras files
 * Below is a list of sources in order of priority (from low to high):
 * - jetpack-docker-config-default.yml - default Docker configuration
 * - compose-volumes.yml - (Deprecated) User-defined volume mapping overrides
 * - compose-extras.yml - (Deprecated) User-defined docker-compose overrides
 * - jetpack-docker-config.yml - User-defined Docker configuration
 *
 * @returns {object} config
 */
const getConfig = () => {
	let json = yaml.load( readFileSync( defaultConfigFile, 'utf8' ) );

	// compose-volumes and compose-extras are deprecated. TODO: Remove it in few months.
	json = getDeprecatedVolumesMapping( json );
	json = getDeprecatedExtras( json );

	if ( existsSync( overrideConfigFile ) ) {
		const overrideConfig = yaml.load( readFileSync( overrideConfigFile, 'utf8' ) );
		json = mergeJson( json, overrideConfig );
	}

	// For end user convenience, jetpack-docker-config expect to have mappings relative to repo root, but in docker-compose file we actually want to have these mappings relative to tools/docker.
	// Below we magically replacing the mappings to match docker expectations.
	const types = Object.keys( json );
	types.forEach( type => {
		if ( ! json[ type ].volumeMappings ) {
			return;
		}
		const paths = Object.entries( json[ type ].volumeMappings ).map(
			( [ localPath, dockerPath ] ) => {
				let relPath = path.relative( dockerFolder, localPath );
				if ( ! relPath.startsWith( '.' ) ) {
					relPath = './' + relPath;
				}
				return `${ relPath }:${ dockerPath }`;
			}
		);
		json[ type ].volumeMappings = paths;
	} );

	return json;
};

/**
 * Generates docker-compose file with pre-configured volume mappings
 *
 * @param {object} argv - Yargs
 * @param {object} config - Configuration object
 */
const setMappings = ( argv, config ) => {
	let volumesMapping = config.default.volumeMappings;

	// In case custom mapping overrides the default one, lets properly handle it.
	// Above logic covers only local path overrides.
	if ( config[ argv.type ] && config[ argv.type ].volumeMappings ) {
		volumesMapping = mergeDockerVolumeMappings(
			config.default.volumeMappings,
			config[ argv.type ].volumeMappings
		);
	}

	const mappingsCompose = {
		version: '3.3',
		services: {
			wordpress: {
				volumes: volumesMapping,
			},
		},
	};

	if ( argv.type === 'dev' ) {
		mappingsCompose.services.sftp = {
			volumes: volumesMapping.map( vol => vol.replace( ':', ':/home/wordpress' ) ),
		};
	}

	const volumesBuiltFile = `${ dockerFolder }/compose-mappings.built.yml`;
	writeFileSync( volumesBuiltFile, yaml.dump( mappingsCompose ) );
};

/**
 * Generates Extras compose file based on jetpack-docker-config.yml config files
 *
 * @param {object} argv - Yargs
 * @param {object} config - Configuration object
 */
const setExtrasConfig = ( argv, config ) => {
	let extrasCompose = {
		version: '3.3',
	};

	if ( config.default && config.default.extras ) {
		extrasCompose = mergeJson( extrasCompose, config.default.extras );
	}
	if ( config[ argv.type ] && config[ argv.type ].extras ) {
		extrasCompose = mergeJson( extrasCompose, config[ argv.type ].extras );
	}

	const extrasBuiltFile = `${ dockerFolder }/compose-extras.built.yml`;
	writeFileSync( extrasBuiltFile, yaml.dump( extrasCompose ) );
};

/**
 * Generates required configuration files according to passed argv flags
 *
 * @param {object} argv - Argv
 */
export function setConfig( argv ) {
	const config = getConfig();

	setMappings( argv, config );
	setExtrasConfig( argv, config );
}
