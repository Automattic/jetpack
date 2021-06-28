/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './instant-search-upsell-nudge.scss';

const InstantSearchUpsellNudge = props => {
	return (
		<div className="jp-search-dashboard__instant-search-upsell-nudge">
			<a className="jp-search-dashboard__instant-search-upsell-description" href={ props.href }>
				<span>
					{ __(
						'Offer instant search results to your visitors as soon as they start typing. ',
						'jetpack'
					) }
					<b>{ __( 'Upgrade to Jetpack Instant Search now', 'jetpack' ) }</b>
				</span>
				<div className="jp-search-dashboard__instant-search-upsell-arrow">&rarr;</div>
			</a>
		</div>
	);
};

export default InstantSearchUpsellNudge;
