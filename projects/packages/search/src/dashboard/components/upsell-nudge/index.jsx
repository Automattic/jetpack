import { __ } from '@wordpress/i18n';

import './style.scss';

/**
 * Upsell nudge component
 *
 * @param {object} props - Props
 * @return {import('react').Component} - Upsell nudge component.
 */
export default function InstantSearchUpsellNudge( props = { upgrade: true } ) {
	return (
		// `onClick` handles the activation; `href` stays so it still behaves as a link
		// (middle-click, copy link address) and points at the checkout it falls back to.
		<a
			className="jp-instant-search-upsell-nudge jp-search-dashboard-cut"
			href={ props.href }
			onClick={ props.onClick }
		>
			<span>
				{ __(
					'Offer instant search results to your visitors as soon as they start typing.',
					'jetpack-search-pkg'
				) }
			</span>{ ' ' }
			<span>
				<b>{ __( 'Try Jetpack Instant Search for free now', 'jetpack-search-pkg' ) }</b>
			</span>
		</a>
	);
}
