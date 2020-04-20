/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';

const IncomeQuestion = props => {
	return (
		<div className="jp-setup-wizard-main">
			<img
				width="200px"
				height="200px"
				src={ imagePath + '/generating-cash-2.svg' }
				alt={ __( 'A jetpack site generating revenue' ) }
			/>
		</div>
	);
};

export { IncomeQuestion };
