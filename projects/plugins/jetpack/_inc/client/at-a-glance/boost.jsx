/**
 * External dependencies
 */
import React, { Component } from 'react';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import { createInterpolateElement } from '@wordpress/element';

const BOOST_PLUGIN_FILE = 'jetpack-boost/jetpack-boost.php';
const BOOST_PLUGIN_SLUG = 'jetpack-boost';

/**
 * Internal dependencies
 */
import PluginDashItem from 'components/plugin-dash-item';

class DashBoost extends Component {
	static propTypes = {
		siteRawUrl: PropTypes.string.isRequired,
	};

	render() {
		return (
			<PluginDashItem
				pluginName={ __( 'Boost', 'jetpack' ) }
				pluginFile={ BOOST_PLUGIN_FILE }
				pluginSlug={ BOOST_PLUGIN_SLUG }
				installOrActivatePrompt={ createInterpolateElement(
					__(
						'Improve your site’s performance and SEO in a few clicks with the free Jetpack Boost plugin.<br /><a>Learn more.</a>',
						'jetpack'
					),
					{
						a: (
							<a
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
