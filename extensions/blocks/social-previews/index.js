/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';

/**
 * Internal dependencies
 */
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';

export const name = 'social-previews';

export const settings = {
	render: () => <SocialPreviews />,
};

class SocialPreviews extends Component {
	render() {
		return <JetpackPluginSidebar>{ /* TODO: Content will go here! */ }</JetpackPluginSidebar>;
	}
}
