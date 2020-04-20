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

import './style.scss';

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
			<p className="jp-setup-wizard-subtitle">{ __( 'Check all that apply' ) }</p>
			<div className="jp-setup-wizard-income-answer-container">
				<div classname="jp-setup-wizard-income-answer">
					<input type="checkbox" checked="checked" />
					<p>{ __( 'Advertising or affiliate marketing' ) }</p>
					<p>{ __( "You're planning on putting ads and or affiliate links on your website." ) }</p>
				</div>
				<div classname="jp-setup-wizard-income-answer">
					<input type="checkbox" checked="checked" />
					<p>{ __( 'Online store' ) }</p>
					<p>
						{ __(
							"You're planning on selling physical goods, digital downloads, or services directly to your customers."
						) }
					</p>
				</div>
				<div classname="jp-setup-wizard-income-answer">
					<input type="checkbox" checked="checked" />
					<p>{ __( 'Appointments / bookings' ) }</p>
					<p>
						{ __(
							'Your services require booking appointments online, for example a hair salon or accountant.'
						) }
					</p>
				</div>
				<div classname="jp-setup-wizard-income-answer">
					<input type="checkbox" checked="checked" />
					<p>{ __( 'Physical location' ) }</p>
					<p>
						{ __(
							'You have a physical store or business and this website will help drive foot traffic to your location.'
						) }
					</p>
				</div>
			</div>
		</div>
	);
};

IncomeQuestion.propTypes = {
	siteRawUrl: PropTypes.string.isRequired,
};

export { IncomeQuestion };
