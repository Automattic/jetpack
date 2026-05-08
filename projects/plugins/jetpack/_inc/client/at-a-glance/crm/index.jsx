import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import PropTypes from 'prop-types';
import { Component } from 'react';
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
				pluginName="CRM" /* "CRM" is a product name, do not translate. */
				pluginFiles={ CRM_PLUGIN_FILES }
				pluginSlug={ CRM_PLUGIN_SLUG }
				pluginLink={ this.props.siteAdminUrl + CRM_PLUGIN_DASH }
				installOrActivatePrompt={ createInterpolateElement(
					__(
						'Sell more and get more leads with the free Jetpack CRM plugin built specifically for WordPress.<br /><Link>Learn more</Link>',
						'jetpack'
					),
					{
						Link: <Link openInNewTab href={ getRedirectUrl( 'stats-nudges-crm-learn' ) } />,
						br: <br />,
					}
				) }
				plan={ FEATURE_JETPACK_CRM }
			/>
		);
	}
}

export default DashCRM;
