import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import PropTypes from 'prop-types';
import { Component } from 'react';
// NOTE: PluginDashItem preserved — Jetpack compound widget (plugin install flow + Redux).
import PluginDashItem from 'components/plugin-dash-item';
import { FEATURE_JETPACK_CRM } from 'lib/plans/constants';

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
						'Sell more and get more leads with the free Jetpack CRM plugin built specifically for WordPress.<br /><ExternalLink>Learn more</ExternalLink>',
						'jetpack'
					),
					{
						ExternalLink: (
							<Link href={ getRedirectUrl( 'stats-nudges-crm-learn' ) } openInNewTab />
						),
						br: <br />,
					}
				) }
				plan={ FEATURE_JETPACK_CRM }
			/>
		);
	}
}

export default DashCRM;
