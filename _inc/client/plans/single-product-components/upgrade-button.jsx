/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

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
		<div className="single-product-backup__upgrade-button-container">
			<Button href={ link } onClick={ onClickHandler( type ) } primary>
				{ __( 'Upgrade to %(name)s', {
					args: { name },
					comment: 'Button to purchase product upgrade. %(name)s is the product name.',
				} ) }
			</Button>
		</div>
	);
}
