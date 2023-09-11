import { __ } from '@wordpress/i18n';
import React from 'react';

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
				<b>{ __( 'Try Jetpack Instant Search for free now', 'jetpack-search-pkg' ) }</b>
			</span>
		</a>
	);
}
