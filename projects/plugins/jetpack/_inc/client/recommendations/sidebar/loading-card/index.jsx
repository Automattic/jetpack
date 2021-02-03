/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';

/**
 * Style dependencies
 */
import './style.scss';

export const LoadingCard = () => {
	return (
		<div className="jp-recommendations-loading-card">
			<img src={ imagePath + '/jetpack-logomark-blue.svg' } alt="" />
		</div>
	);
};
