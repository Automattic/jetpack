/**
 * External dependencies
 */
import React from 'react';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Button from 'components/button';

export default function UpgradeButton( { selectedUpgrade, onClickHandler } ) {
	if ( ! selectedUpgrade ) {
		return null;
	}
	const { link, name, type } = selectedUpgrade;
	return (
		<div className="single-product__upgrade-button-container">
			<Button href={ link } onClick={ onClickHandler( type ) } primary>
				{ sprintf(
					/* translators: Button to purchase product upgrade. Placeholder is the product name. */
					__( 'Upgrade to %s', 'jetpack' ),
					name
				) }
			</Button>
		</div>
	);
}
