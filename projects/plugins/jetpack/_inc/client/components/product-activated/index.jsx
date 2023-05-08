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
		<div
			className={
				'jp-product-activated-label' + ( type === 'never-expires' ? ' never-expires' : '' )
			}
		>
			<span className="jp-product-activated-label__text">
				{ type === 'never-expires'
					? __( 'Never expires', 'jetpack' )
					: __( 'Subscription active', 'jetpack' ) }
			</span>
		</div>
	);
};

export { ProductActivated };
