/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';
import { ExternalLink } from '@wordpress/components';
import { getRedirectUrl } from '@automattic/jetpack-components';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import peopleSvgUrl from './people.svg';
import PluginDashItem from 'components/plugin-dash-item';

const CRM_PLUGIN_DASH = 'admin.php?page=zerobscrm-dash';
const CRM_PLUGIN_FILES = [ 'zero-bs-crm/ZeroBSCRM.php' ];
const CRM_PLUGIN_SLUG = 'zero-bs-crm';

class DashCRM extends Component {
	static propTypes = {
		siteAdminUrl: PropTypes.string.isRequired,
	};

	render() {
		return (
			<PluginDashItem
				iconAlt={ __( 'Plugin icon', 'jetpack' ) }
				iconSrc={ peopleSvgUrl }
				pluginName={ _x(
					'CRM',
					'The Jetpack CRM product name, without the Jetpack prefix',
					'jetpack'
				) }
				pluginFiles={ CRM_PLUGIN_FILES }
				pluginSlug={ CRM_PLUGIN_SLUG }
				pluginLink={ this.props.siteAdminUrl + CRM_PLUGIN_DASH }
				installOrActivatePrompt={ createInterpolateElement(
					__(
						'Sell more and get more leads with the Jetpack CRM plugin built specifically for WordPress.<br /><ExternalLink>Learn more</ExternalLink>',
						'jetpack'
					),
					{
						ExternalLink: <ExternalLink href={ getRedirectUrl( 'stats-nudges-crm-learn' ) } />,
						br: <br />,
					}
				) }
			/>
		);
	}
}

export default DashCRM;
