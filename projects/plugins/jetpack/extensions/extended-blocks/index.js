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
	if ( ! betaExtensions || ! betaExtensions.includes( name ) ) {
		return settings;
	}

	return {
		...settings,
		title: `${ settings.title } (beta)`,
	};
}

addFilter( 'blocks.registerBlockType', 'jetpack/label-blocks-title', labelBlocksTitle );
