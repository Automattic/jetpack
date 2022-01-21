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
import boostSvgUrl from './boost.svg';
import PluginDashItem from 'components/plugin-dash-item';

const BOOST_PLUGIN_DASH = 'admin.php?page=jetpack-boost';
const BOOST_PLUGIN_FILE = 'jetpack-boost/jetpack-boost.php';
const BOOST_PLUGIN_SLUG = 'jetpack-boost';

class DashBoost extends Component {
	static propTypes = {
		siteAdminUrl: PropTypes.string.isRequired,
	};

	render() {
		return (
			<PluginDashItem
				iconAlt={ __( 'Plugin icon', 'jetpack' ) }
				iconSrc={ boostSvgUrl }
				pluginName={ _x(
					'Boost',
					'The Jetpack Boost product name, without the Jetpack prefix',
					'jetpack'
				) }
				pluginFile={ BOOST_PLUGIN_FILE }
				pluginSlug={ BOOST_PLUGIN_SLUG }
				pluginLink={ this.props.siteAdminUrl + BOOST_PLUGIN_DASH }
				installOrActivatePrompt={ createInterpolateElement(
					__(
						'Improve your site’s performance and SEO in a few clicks with the free Jetpack Boost plugin.<br /><ExternalLink>Learn more</ExternalLink>',
						'jetpack'
					),
					{
						ExternalLink: <ExternalLink href={ getRedirectUrl( 'stats-nudges-boost-learn' ) } />,
						br: <br />,
					}
				) }
			/>
		);
	}
}

export default DashBoost;
