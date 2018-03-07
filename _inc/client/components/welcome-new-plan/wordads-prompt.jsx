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

class WordAdsPrompt extends React.Component {
	render() {
		return <div>
			<img src={ imagePath + 'wordads.svg' } className="jp-welcome__svg" alt={ __( 'WordAds' ) } />
			<p>
				{ __( 'Earn income by displaying high-quality ads on your site. ' +
					'Jetpack Ads is a one-click feature designed to help you generate income from your WordPress site. ' +
					'Jetpack Ads is powered by WordAds — the unique ad program from WordPress.com. '
				) }
			</p>
			<InlineModuleToggle module_slug="wordads" />
		</div>;
	}
}

export default WordAdsPrompt;
