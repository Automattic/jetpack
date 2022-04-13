/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * SearchPromotionBlock component definition.
 *
 * @returns {React.Component} SearchPromotionBlock component.
 */
export default function SearchPromotionBlock() {
	return (
		<>
			<h3>
				{ __(
					"Allow viewers to search through your site's records, lightning fast.",
					'jetpack-search-pkg'
				) }
			</h3>
			<ul>
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
			</ul>
		</>
	);
}
