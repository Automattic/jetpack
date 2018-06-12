/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';
import InlineModuleToggle from 'components/module-settings/inline-module-toggle';

class SocialSeoAdsPrompt extends React.Component {
	render() {
		return <div>
			<img src={ imagePath + 'wordads.svg' } className="jp-welcome__svg" alt={ __( 'Sharing' ) } />
			<p>
				{ __( 'Growing your following is easy with your Professional plan, thanks to content sharing and scheduling,' +
					' SEO tools, and built-in subscription options. You can monetize your site with a simple payment button ' +
					'and in-line ads, and monitor the success of your efforts by integrating with Google Analytics.'
				) }
			</p>
			<InlineModuleToggle module_slug="publicize" />
			<InlineModuleToggle module_slug="wordads" />
			<InlineModuleToggle module_slug="seo-tools" />
			<InlineModuleToggle module_slug="google-analytics" />
		</div>;
	}
}

export default SocialSeoAdsPrompt;
