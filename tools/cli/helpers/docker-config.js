/**
 * External dependencies
 */
import { readFileSync, writeFileSync, existsSync } from 'fs';
import yaml from 'js-yaml';
import path from 'path';
import { merge } from 'lodash';

export const dockerFolder = `tools/docker`;

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

const getConfig = () => {
	const defaultConfigFile = `${ dockerFolder }/.docker-env-default.json`;
	const overrideConfigFile = `.docker-env.json`;

	const defaultConfig = JSON.parse( readFileSync( defaultConfigFile, 'utf8' ) );

	let overrideConfig = {};
	if ( existsSync( overrideConfigFile ) ) {
		overrideConfig = JSON.parse( readFileSync( overrideConfigFile, 'utf8' ) );
	}

	const json = merge( defaultConfig, overrideConfig );
	console.log( json );

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
 * Generates Mappings compose file based on docker-env.json config files
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

	// compose-volumes are deprecated. TODO: Remove it in few months.
	const volumesFile = `${ dockerFolder }/compose-volumes.yml`;
	const volumes = yaml.load( readFileSync( volumesFile, 'utf8' ) );
	volumesMapping = mergeDockerVolumeMappings( volumesMapping, volumes );

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
