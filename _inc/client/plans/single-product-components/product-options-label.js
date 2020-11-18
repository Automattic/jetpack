/**
 * External dependencies
 */
import React from 'react';

/**
 * WordPress dependencies
 */
import { _n, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import InfoPopover from 'components/info-popover';
import { numberFormat } from 'components/number-format';

function getSearchLabel( recordCount ) {
	return sprintf(
		/* translators: placeholder is a number of records (posts, pages, ...) on your site. */
		_n(
			'Your current site record size: %s record',
			'Your current site record size: %s records',
			recordCount,
			'jetpack'
		),
		numberFormat( recordCount )
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
