/**
 * External dependencies
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { merge } from 'lodash';

export const dockerFolder = `tools/docker`;
const overrideConfigFile = '.docker-env.json';

const mergeDockerVolumeMappings = ( mainMapping, overrideMapping ) => {
	const volumesMapping = overrideMapping.slice(); // make a copy of an array;

	const typeLocPaths = overrideMapping.map( map => map.split( ':' )[ 0 ] );
	const defaultLocPaths = mainMapping.map( map => map.split( ':' )[ 0 ] );
	defaultLocPaths.forEach( ( defaultPath, id ) => {
		if ( ! typeLocPaths.includes( defaultPath ) ) {
			volumesMapping.unshift( mainMapping[ id ] );
		}
	} );

	return volumesMapping;
};

/**
 * DEPRECATED. Parses compose-volumes.yml and adds it's contents into docker config
 *
 * @param {object} config - Docker configuration
 * @returns {object} config
 */
const getDeprecatedVolumesMapping = config => {
	const volumesFile = `${ dockerFolder }/compose-volumes.yml`;
	const volumes = yaml.load( readFileSync( volumesFile, 'utf8' ) );

	// convert array of docker volumes into a object of local/docker paths
	const volumesObj = volumes.reduce( ( acc, volume ) => {
		const [ localPath, dockerPath ] = volume.split( ':' );
		let relPath = path.relative( '.', 'tools/docker/' + localPath );
		if ( ! relPath ) {
			relPath = '.';
		}
		acc[ relPath ] = dockerPath;
		return acc;
	}, {} );

	config.dev = {};
	config.dev.mappings = volumesObj;
	return config;
};

/**
 * DEPRECATED. Parses compose-extras.yml and adds it's contents into docker config
 *
 * @param {object} config - Docker configuration
 * @returns {object} config
 */
const getDeprecatedExtras = config => {
	const extrasFile = `${ dockerFolder }/compose-extras.yml`;
	const extras = yaml.load( readFileSync( extrasFile, 'utf8' ) );
	delete extras.version;
	config.dev.extras = extras;
	return config;
};

/**
 * Compose a config object using multiple sources.
 * To keep the backward compatibility, it pulls configuration from compose-volumes and compose-extras files
 * Below is a list of sources in order of priority (from low to high):
 * - .docker-env-default.json - default Docker configuration
 * - compose-volumes.yml - (Deprecated) User-defined volume mapping overrides
 * - compose-extras.yml - (Deprecated) User-defined docker-compose overrides
 * - .docker-env.yml - User-defined Docker configuration
 *
 * @returns {object} config
 */
const getConfig = () => {
	const configFile = `${ dockerFolder }/.docker-env-default.json`;
	let json = JSON.parse( readFileSync( configFile, 'utf8' ) );

	// compose-volumes and compose-extras are deprecated. TODO: Remove it in few months.
	json = getDeprecatedVolumesMapping( json );
	json = getDeprecatedExtras( json );

	if ( existsSync( overrideConfigFile ) ) {
		const overrideConfig = JSON.parse( readFileSync( overrideConfigFile, 'utf8' ) );
		json = merge( json, overrideConfig );
	}

	// For end user convenience, .docker-env expect to have mappings relative to repo root, but in docker-compose file we actually want to have these mappings relative to tools/docker.
	// Below we magically replacing the mappings to match docker expectations.
	const types = Object.keys( json );
	types.forEach( type => {
		const paths = Object.entries( json[ type ].mappings ).map( ( [ localPath, dockerPath ] ) => {
			let relPath = path.relative( dockerFolder, localPath );
			if ( ! relPath.startsWith( '.' ) ) {
				relPath = './' + relPath;
			}
			return `${ relPath }:${ dockerPath }`;
		} );
		json[ type ].mappings = paths;
	} );

	return json;
};

/**
 * Generates docker-compose file with pre-configured volume mappings
 *
 * @param {object} argv - Yargs
 */
export const setMappings = argv => {
	const config = getConfig();

	let volumesMapping = config.default.mappings;

	// In case custom mapping overrides the default one, lets properly handle it.
	// Above logic covers only local path overrides.
	if ( config[ argv.type ] && config[ argv.type ].mappings ) {
		volumesMapping = mergeDockerVolumeMappings(
			config.default.mappings,
			config[ argv.type ].mappings
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
			volumes: volumesMapping.map( vol =>
				vol.replace( /\/var\/www\/html/, '/home/wordpress/var/www/html' )
			),
		};
	}

	const volumesBuiltFile = `${ dockerFolder }/compose-mappings.built.yml`;
	writeFileSync( volumesBuiltFile, yaml.dump( mappingsCompose ) );
};

/**
 * Generates Extras compose file based on docker-env.json config files
 *
 * @param {object} argv - Yargs
 */
export const setExtrasConfig = argv => {
	const config = getConfig();

	let extrasCompose = {
		version: '3.3',
	};

	if ( config[ argv.type ] && config[ argv.type ].extras ) {
		extrasCompose = Object.assign( extrasCompose, config[ argv.type ].extras );
	}

	const extrasBuiltFile = `${ dockerFolder }/compose-extras.built.yml`;
	console.log( extrasBuiltFile );
	writeFileSync( extrasBuiltFile, yaml.dump( extrasCompose ) );
};
