/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { PanelBody } from '@wordpress/components';

/**
 * Internal dependencies
 */
import JetpackPluginSidebar from '../../shared/jetpack-plugin-sidebar';

class PostLocationPanel extends Component {
	render() {
		return (
			<JetpackPluginSidebar>
				<PanelBody title={ __( 'Location', 'jetpack' ) } className="jetpack-post-location__panel">
					POST LOCATION!
				</PanelBody>
			</JetpackPluginSidebar>
		);
	}
}

export default PostLocationPanel;
