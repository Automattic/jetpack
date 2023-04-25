import { __ } from '@wordpress/i18n';
import React from 'react';

import './style.scss';

const ProductActivated = () => {
	return (
		<div className="jp-product-activated-label">
			<span className="jp-product-activated-label__text">
				{ __( 'Subscription activated', 'jetpack' ) }
			</span>
		</div>
	);
};

export { ProductActivated };
