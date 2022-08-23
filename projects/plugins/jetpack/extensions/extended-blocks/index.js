/**
 * External dependencies
 */
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import extensionList from '../index.json';

function labelBlocksTitle( settings, name ) {
	if ( ! extensionList ) {
		return;
	}

	const betaExtensions = extensionList.beta || [];
	/*
	 * Some extensions are defined without the jetpack/ prefix,
	 * so we need to check for both :-/
	 */
	const cleanName = name.replace( /jetpack\//, '' );

	if (
		! betaExtensions ||
		( ! betaExtensions.includes( name ) && ! betaExtensions.includes( cleanName ) )
	) {
		return settings;
	}

	return {
		...settings,
		title: `${ settings.title } (beta)`,
	};
}

addFilter( 'blocks.registerBlockType', 'jetpack/label-blocks-title', labelBlocksTitle );
