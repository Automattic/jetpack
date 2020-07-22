/**
 * External dependencies
 */
import { uniq } from 'lodash';
/**
 * WordPress dependencies
 */
import { addFilter } from '@wordpress/hooks';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import withCustomClassNames from '../with-custom-class-names';
import jetpackPaidBlockEdit from './paid-block-edit';
import { isUpgradable } from '../plan-utils';
import { PremiumIcon } from './components';

import './editor.scss';

const jetpackPaidBlock = ( settings, name ) => {
	if ( isUpgradable( name ) ) {
		settings.icon = {
			src: <PremiumIcon icon={ settings.icon } />,
		};

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
