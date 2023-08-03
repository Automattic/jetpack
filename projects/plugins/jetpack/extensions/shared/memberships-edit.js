/**
 * This file contains shared utils for the Editor side of memberships and subscriptions blocks/extensions.
 * For frontend js use memberships.js
 */

import { getJetpackData } from '@automattic/jetpack-shared-extension-utils';
import { useEntityProp } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

export const META_NAME_FOR_POST_LEVEL_ACCESS_SETTINGS = '_jetpack_newsletter_access';

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

export const accessOptions = {
	everybody: {
		key: 'everybody',
		label: __( 'Everyone', 'jetpack' ),
		panelHeading: __( 'Everyone', 'jetpack' ),
	},
	subscribers: {
		key: 'subscribers',
		label: __( 'Anyone subscribed', 'jetpack' ),
		panelHeading: __( 'All subscribers', 'jetpack' ),
	},
	paid_subscribers: {
		key: 'paid_subscribers',
		label: __( 'Paid subscribers only', 'jetpack' ),
		panelHeading: __( 'Paid subscribers', 'jetpack' ),
	},
};

export const isNewsletterFeatureEnabled = () => {
	return getJetpackData()?.jetpack?.is_newsletter_feature_enabled ?? false;
};
