/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { ChecklistAnswer } from '../checklist-answer';
import Button from 'components/button';
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
					args: { siteUrl: props.siteTitle },
				} ) }
			</h1>
			<p className="jp-setup-wizard-subtitle">{ __( 'Check all that apply' ) }</p>
			<div className="jp-setup-wizard-income-answer-container">
				<ChecklistAnswer
					title={ 'Advertising or affiliate marketing' }
					details={ "You're planning on putting ads and or affiliate links on your website." }
				/>
				<ChecklistAnswer
					title={ 'Online store' }
					details={
						"You're planning on selling physical goods, digital downloads, or services directly to your customers."
					}
				/>
				<ChecklistAnswer
					title={ 'Appointments / bookings' }
					details={
						'Your services require booking appointments online, for example a hair salon or accountant.'
					}
				/>
				<ChecklistAnswer
					title={ 'Physical location' }
					details={
						'You have a physical store or business and this website will help drive foot traffic to your location.'
					}
				/>
			</div>
			<div className="jp-setup-wizard-advance-container">
				<Button primary className="jp-setup-wizard-button">
					{ __( 'Continue' ) }
				</Button>
				<a className="jp-setup-wizard-skip-link" href="">
					{ __( 'None of these apply' ) }
				</a>
			</div>
		</div>
	);
};

IncomeQuestion.propTypes = {
	siteTitle: PropTypes.string.isRequired,
};

export { IncomeQuestion };
