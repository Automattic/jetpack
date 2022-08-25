/**
 * External dependencies
 */
import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
/**
 * Internal dependencies
 */
import extensionList from '../index.json';
import './index.scss';

function isBetaExtension( name ) {
	if ( ! extensionList ) {
		return;
	}

	const betaExtensions = extensionList.beta || [];

	/*
	 * Some extensions are defined without the `jetpack/` prefix,
	 * so we need to check for both since, for instance,
	 * the jetpack blocks are prefixed with `jetpack/`.
	 */
	const cleanName = name.replace( /jetpack\//, '' );

	return betaExtensions.includes( name ) || betaExtensions.includes( cleanName );
}

function labelBlocksTitle( settings, name ) {
	if ( ! isBetaExtension( name ) ) {
		return settings;
	}

	return {
		...settings,
		title: `${ settings.title } (beta)`,
		kewords: [ ...settings.keywords, 'beta' ],
	};
}

addFilter( 'blocks.registerBlockType', 'jetpack/label-blocks-title', labelBlocksTitle );

const withBetaClassName = createHigherOrderComponent( BlockListBlock => {
	return props => {
		const { name } = props;
		if ( ! isBetaExtension( name ) ) {
			return <BlockListBlock { ...props } />;
		}

		return <BlockListBlock { ...props } className="is-beta-extension" />;
	};
}, 'withBetaClassName' );

addFilter( 'editor.BlockListBlock', 'my-plugin/with-client-id-class-name', withBetaClassName );
