/**
 * External dependencies
 */
import React from 'react';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';

/**
 * Style dependencies
 */
import './style.scss';

const ProductActivated = () => {
	return (
		<div className="jp-product-activated-label">
			<Gridicon icon="checkmark" size={ 20 } />

			<span className="jp-product-activated-label__text">{ __( 'Activated', 'jetpack' ) }</span>
		</div>
	);
};

export { ProductActivated };
