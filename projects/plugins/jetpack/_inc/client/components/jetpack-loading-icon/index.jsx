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

export const JetpackLoadingIcon = () => {
	return (
		<div className="jp-loading-icon">
			<img src={ imagePath + '/jetpack-logomark-blue.svg' } alt="Loading..." />
		</div>
	);
};
