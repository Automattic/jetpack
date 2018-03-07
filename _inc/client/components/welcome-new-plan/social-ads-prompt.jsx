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
				{ __( 'Using Jetpack’s powerful sharing tools, you can automatically share your newest posts on social media,' +
					' or schedule your content to be re-shared at any date or time you choose. And along with growing your ' +
					'following, you can grow your business with tools like payment buttons and ads.'
				) }
			</p>
			<InlineModuleToggle module_slug="publicize" />
			<InlineModuleToggle module_slug="wordads" />
		</div>;
	}
}

export default SocialSeoAdsPrompt;
