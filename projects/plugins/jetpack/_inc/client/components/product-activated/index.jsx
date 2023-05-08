import { __, _x } from '@wordpress/i18n';
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
		<div
			className={
				'jp-product-activated-label' + ( type === 'never-expires' ? ' never-expires' : '' )
			}
		>
			<span className="jp-product-activated-label__text">
				{ type === 'never-expires'
					? _x( 'Never expires', 'Label for a subscription that never expires', 'jetpack' )
					: _x( 'Subscription active', 'Label for an active subscription', 'jetpack' ) }
			</span>
		</div>
	);
};

export { ProductActivated };
