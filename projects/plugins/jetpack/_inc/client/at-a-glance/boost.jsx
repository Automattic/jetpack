/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';

const BOOST_PLUGIN_FILE = 'jetpack-boost/jetpack-boost.php';
const BOOST_PLUGIN_SLUG = 'jetpack-boost';

/**
 * Internal dependencies
 */
import PluginDashItem from 'components/plugin-dash-item';

class DashBoost extends Component {
	render() {
		return (
			<PluginDashItem
				label={ __( 'Boost', 'jetpack' ) }
				pluginFile={ BOOST_PLUGIN_FILE }
				pluginSlug={ BOOST_PLUGIN_SLUG }
			/>
		);
	}
}

export default DashBoost;
