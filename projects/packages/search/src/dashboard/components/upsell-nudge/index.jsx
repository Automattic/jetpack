/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import './style.scss';

/**
 * Upsell nudge component
 *
 * @param {object} props - Props
 * @returns {React.Component}	- Upsell nudge component.
 */
export default function InstantSearchUpsellNudge( props = { upgrade: true } ) {
	return (
		<a className="jp-instant-search-upsell-nudge jp-search-dashboard-cut" href={ props.href }>
			<span>
				{ __(
					'Offer instant search results to your visitors as soon as they start typing. ',
					'jetpack-search-pkg'
				) }
			</span>
			<span>
				{ props.upgrade && (
					<b>{ __( 'Upgrade to Jetpack Instant Search now', 'jetpack-search-pkg' ) }</b>
				) }
				{ ! props.upgrade && (
					<b>{ __( 'Purchase Jetpack Instant Search now', 'jetpack-search-pkg' ) }</b>
				) }
			</span>
		</a>
	);
}
