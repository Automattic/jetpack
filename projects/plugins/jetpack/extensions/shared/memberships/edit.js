/**
 * This file contains shared utils for the Editor side of memberships and subscriptions blocks/extensions.
 * For frontend js use memberships.js
 */

import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { useEntityProp } from '@wordpress/core-data';
import { accessOptions, META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS } from './constants';

export const useAccessLevel = postType => {
	const [ postMeta = [] ] = useEntityProp( 'postType', postType, 'meta' );

	let accessLevel =
		postMeta[ META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS ] ?? accessOptions.everybody.key;

	// If accessLevel is ''
	if ( ! accessLevel ) {
		accessLevel = accessOptions.everybody.key;
	}
	return accessLevel;
};

export const isNewsletterFeatureEnabled = () => {
	return getJetpackData()?.jetpack?.is_newsletter_feature_enabled ?? false;
};
