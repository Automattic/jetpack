/**
 * External dependencies
 */
import { uniq } from 'lodash';
/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';
import domReady from '@wordpress/dom-ready';

/**
 * Internal dependencies
 */
import withCustomClassNames from '../with-custom-class-names';
import jetpackPaidBlockEdit from './paid-block-edit';
import { isUpgradable, isUpgradeNudgeEnabled } from '../plan-utils';

import './editor.scss';

const jetpackPaidBlock = ( settings, name ) => {
	if ( isUpgradable( name ) ) {
		// Populate block keywords.
		settings.keywords = uniq( [ ...settings.keywords, 'premium', __( 'premium' ) ] );

		settings.edit = jetpackPaidBlockEdit( settings.edit );
	}

	return settings;
};

addFilter( 'blocks.registerBlockType', 'jetpack/paid-block', jetpackPaidBlock, 1 );

addFilter(
	'blocks.getBlockDefaultClassName',
	`jetpack/set-upgradable-classnames`,
	withCustomClassNames( 'has-warning is-interactive is-upgradable' )
);

domReady( function() {
	if ( isUpgradeNudgeEnabled() ) {
		document.body.classList.add( 'jetpack-enable-upgrade-nudge' );
	}
} );
