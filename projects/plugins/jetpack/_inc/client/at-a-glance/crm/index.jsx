/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { createInterpolateElement } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';

/**
 * Internal dependencies
 */
import peopleSvgUrl from './people.svg';
import PluginDashItem from 'components/plugin-dash-item';

const CRM_PLUGIN_DASH = '/wp-admin/admin.php?page=zerobscrm-dash';
const CRM_PLUGIN_FILE = 'zero-bs-crm/ZeroBSCRM.php';
const CRM_PLUGIN_SLUG = 'zero-bs-crm';

class DashCRM extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
	};

	render() {
		return (
			<PluginDashItem
				iconSrc={ peopleSvgUrl }
				pluginName={ __( 'CRM', 'jetpack' ) }
				pluginFile={ CRM_PLUGIN_FILE }
				pluginSlug={ CRM_PLUGIN_SLUG }
				pluginLink={ CRM_PLUGIN_DASH }
				installOrActivatePrompt={ createInterpolateElement(
					__(
						'Sell more and get more leads with the Jetpack CRM plugin built specifically for WordPress.<br /><ExternalLink>Learn more</ExternalLink>',
						'jetpack'
					),
					{
						ExternalLink: (
							<ExternalLink
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
