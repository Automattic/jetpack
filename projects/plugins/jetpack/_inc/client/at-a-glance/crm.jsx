/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';

const CRM_PLUGIN_FILE = 'zero-bs-crm/ZeroBSCRM.php';
const CRM_PLUGIN_SLUG = 'zero-bs-crm';

/**
 * Internal dependencies
 */
import PluginDashItem from 'components/plugin-dash-item';

class DashCRM extends Component {
	render() {
		return (
			<PluginDashItem
				label={ __( 'CRM', 'jetpack' ) }
				pluginFile={ CRM_PLUGIN_FILE }
				pluginSlug={ CRM_PLUGIN_SLUG }
			/>
		);
	}
}

export default DashCRM;
