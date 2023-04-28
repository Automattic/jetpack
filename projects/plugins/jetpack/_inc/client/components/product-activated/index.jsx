import { __ } from '@wordpress/i18n';
import React from 'react';

import './style.scss';

const ProductActivated = ( { type } ) => {
	if ( type === 'product-expired' ) {
		return (
			<div className="jp-product-activated-label expired">
				<span className="jp-product-expired-label__text">{ __( 'Expired', 'jetpack' ) }</span>
			</div>
		);
	}
	return (
		<div className="jp-product-activated-label">
			<span className="jp-product-activated-label__text">
				{ __( 'Subscription active', 'jetpack' ) }
			</span>
		</div>
	);
};

export { ProductActivated };
