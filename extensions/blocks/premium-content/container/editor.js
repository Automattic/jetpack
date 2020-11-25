/**
 * Internal dependencies
 */
import registerJetpackBlock from '../../../shared/register-jetpack-block';
import { name, settings } from '.';

registerJetpackBlock( name, settings );


// /**
//  * External dependencies
//  */
// import { mergeWith } from 'lodash';

// /**
//  * WordPress dependencies
//  */
// import apiFetch from '@wordpress/api-fetch';
// import { getBlockType, registerBlockType, unregisterBlockType } from '@wordpress/blocks';
// import { __experimentalBlock } from '@wordpress/block-editor';

// /**
//  * Gets the current status of the Memberships module.
//  *
//  * @returns {Promise} Memberships status
//  */
// const getMembershipsStatus = async () => {
// 	try {
// 		return apiFetch( { path: '/wpcom/v2/memberships/status' } );
// 	} catch {
// 		return null;
// 	}
// };

// /**
//  * Hides the buttons block from the inserter if the Memberships module is not set up.
//  *
//  * @param membershipsStatus {object} Memberships status
//  */
// const hideButtonsIfMembershipsNotSetUp = ( membershipsStatus ) => {
// 	if (
// 		! membershipsStatus.should_upgrade_to_access_memberships &&
// 		membershipsStatus.connected_account_id
// 	) {
// 		return;
// 	}

// 	updateBlockType( buttons.name, { supports: { inserter: false } } );
// 	updateBlockType( loginButton.name, { supports: { inserter: false } } );
// };

// /**
//  * Configures the Premium Content blocks.
//  */
// const configurePremiumContentBlocks = async () => {
// 	const membershipsStatus = await getMembershipsStatus();
// 	hideButtonsIfMembershipsNotSetUp( membershipsStatus );
// };

// /**
//  * Function to register Premium Content blocks.
//  */
// export const registerPremiumContentBlocks = () => {
// 	[ container, loggedOutView, subscriberView, buttons, loginButton ].forEach( registerBlock );
// };

// if ( supportsDecoupledBlocks ) {
// 	registerPremiumContentBlocks();
// 	configurePremiumContentBlocks();
// }
