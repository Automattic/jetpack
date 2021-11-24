/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { createInterpolateElement } from '@wordpress/element';

const CRM_PLUGIN_FILE = 'zero-bs-crm/ZeroBSCRM.php';
const CRM_PLUGIN_SLUG = 'zero-bs-crm';

/**
 * Internal dependencies
 */
import PluginDashItem from 'components/plugin-dash-item';

class DashCRM extends Component {

	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
	}

	render() {
		return (
			<PluginDashItem
				pluginName={ __( 'CRM', 'jetpack' ) }
				pluginFile={ CRM_PLUGIN_FILE }
				pluginSlug={ CRM_PLUGIN_SLUG }
				installOrActivatePrompt={
					createInterpolateElement(
						__(
							'Sell more and get more leads with the Jetpack CRM plugin built specifically for WordPress.<br /><a>Learn more</a>',
							'jetpack'
						),
					{
						a: (
							<a
								href={
									'https://jetpack.com/redirect/?source=stats-nudges-crm-learn&site=' +
									this.props.siteRawUrl
								}
							/>
						),
						br: <br />,
					}
				) }
			/>
		);
	}
}

export default DashCRM;
