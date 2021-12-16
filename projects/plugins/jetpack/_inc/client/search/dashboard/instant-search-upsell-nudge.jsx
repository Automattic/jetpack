/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './instant-search-upsell-nudge.scss';

const InstantSearchUpsellNudge = ( props = { upgrade: true } ) => {
	return (
		<a className="jp-instant-search-upsell-nudge jp-search-dashboard-cut" href={ props.href }>
			<span>
				{ __(
					'Offer instant search results to your visitors as soon as they start typing. ',
					'jetpack'
				) }
			</span>
			<span>
				{ props.upgrade && <b>{ __( 'Upgrade to Jetpack Instant Search now', 'jetpack' ) }</b> }
				{ ! props.upgrade && <b>{ __( 'Purchase Jetpack Instant Search now', 'jetpack' ) }</b> }
			</span>
		</a>
	);
};

export default InstantSearchUpsellNudge;
