/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';

export const name = 'social-previews';

export const settings = {
	render: () => <SocialPreviews />,
};

const SocialPreviews = function SocialPreviews() {
	return <JetpackPluginSidebar>{ /* TODO: Content will go here! */ }</JetpackPluginSidebar>;
};
