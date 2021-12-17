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
import boostSvgUrl from './boost.svg'; 
import PluginDashItem from 'components/plugin-dash-item';

const BOOST_PLUGIN_DASH = '/wp-admin/admin.php?page=jetpack-boost';
const BOOST_PLUGIN_FILE = 'jetpack-boost/jetpack-boost.php';
const BOOST_PLUGIN_SLUG = 'jetpack-boost';

class DashBoost extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
	};

	render() {
		return (
			<PluginDashItem
				iconSrc={ boostSvgUrl }
				pluginName={ __( 'Boost', 'jetpack' ) }
				pluginFile={ BOOST_PLUGIN_FILE }
				pluginSlug={ BOOST_PLUGIN_SLUG }
				pluginLink={ BOOST_PLUGIN_DASH }
				installOrActivatePrompt={ createInterpolateElement(
					__(
						'Improve your site’s performance and SEO in a few clicks with the free Jetpack Boost plugin.<br /><ExternalLink>Learn more.</ExternalLink>',
						'jetpack'
					),
					{
						ExternalLink: (
							<ExternalLink
								href={
									'https://jetpack.com/redirect/?source=stats-nudges-boost-learn&site=' +
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

export default DashBoost;
