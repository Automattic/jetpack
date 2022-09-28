import { __ } from '@wordpress/i18n';
import React from 'react';

import './style.scss';

/**
 * SearchPromotion component definition.
 *
 * @returns {React.Component} SearchPromotion component.
 */
export default function SearchPromotion() {
	return (
		<div className="jp-search-dashboard-promotion">
			<h3>
				{ __(
					"Allow viewers to search through your site's records, lightning fast.",
					'jetpack-search-pkg'
				) }
			</h3>
			<ul className="jp-product-promote">
				<li>{ __( 'Customizable filtering', 'jetpack-search-pkg' ) }</li>
				<li>{ __( 'Support for 29 languages', 'jetpack-search-pkg' ) }</li>
				<li>
					{ __( 'Content displayed within results is updated in real-time', 'jetpack-search-pkg' ) }
				</li>
				<li>
					{ __(
						"If you grow into a new pricing tier, we'll let you know before your next billing cycle",
						'jetpack-search-pkg'
					) }
				</li>
				<li>{ __( 'Best-in-class support', 'jetpack-search-pkg' ) }</li>
			</ul>
		</div>
	);
}
