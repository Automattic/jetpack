/**
 * External dependencies
 */
import React from 'react';
import { numberFormat, translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import InfoPopover from 'components/info-popover';

function getSearchLabel( recordCount ) {
	return __(
		'Your current site record size: %s record',
		'Your current site record size: %s records',
		{ args: numberFormat( recordCount ), count: recordCount }
	);
}

export default function ProductOptionsLabel( { product } ) {
	const label =
		'search' === product.key ? getSearchLabel( product.recordCount ) : product.optionsLabel;

	return (
		<h4 className="single-product__options-header">
			{ label }
			{ product.labelPopup && <InfoPopover position="right">{ product.labelPopup }</InfoPopover> }
		</h4>
	);
}
