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
		<a className="jp-instant-search-upsell-nudge" href={ props.href }>
			<span>
				{ __(
					'Offer instant search results to your visitors as soon as they start typing. ',
					'jetpack'
				) }
				<b>{ __( 'Upgrade to Jetpack Instant Search now', 'jetpack' ) }</b>
			</span>
			<div className="jp-instant-search-upsell-nudge__button-arrow">&rarr;</div>
		</a>
	);
};

export default InstantSearchUpsellNudge;
