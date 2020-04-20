/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
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
			<h1>
				{ __( 'Do you intend to make money directly from %(siteUrl)s?', {
					args: { siteUrl: props.siteRawUrl },
				} ) }
			</h1>
			<p>{ __( 'Check all that apply' ) }</p>
		</div>
	);
};

IncomeQuestion.propTypes = {
	siteRawUrl: PropTypes.string.isRequired,
};

export { IncomeQuestion };
