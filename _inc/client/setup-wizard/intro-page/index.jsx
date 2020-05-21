/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import { imagePath } from 'constants/urls';

import './style.scss';

const IntroPage = props => {
	return (
		<div className="jp-setup-wizard-main">
			<img
				width="200px"
				height="200px"
				src={ imagePath + '/jetpack-powering-up.svg' }
				alt={ __( 'A jetpack site powering up' ) }
			/>
			<h1 className="jp-setup-wizard-header">
				{ __( 'Set up Jetpack for better site security, performance, and more' ) }
			</h1>
			<p className="jp-setup-wizard-paragraph">
				{ __( 'Jetpack is a cloud-powered tool built by Automattic.' ) }
			</p>
			<p className="jp-setup-wizard-paragraph">
				{ __(
					'Answer a few questions and we’ll help you secure, speed up, customize, and grow your WordPress website.'
				) }
			</p>
			<div className="jp-setup-wizard-intro-question">
				<h2>
					{ __( 'What will %(siteTitle)s be used for?', { args: { siteTitle: props.siteTitle } } ) }
				</h2>
				<div className="jp-setup-wizard-answer-buttons">
					<Button href="#/setup/income" primary className="jp-setup-wizard-button">
						{ __( 'Personal Use' ) }
					</Button>
					<Button href="#/setup/income" primary className="jp-setup-wizard-button">
						{ __( 'Business Use' ) }
					</Button>
				</div>
				<a className="jp-setup-wizard-skip-link" href="">
					{ __( 'Skip to recommended features' ) }
				</a>
			</div>
		</div>
	);
};

IntroPage.propTypes = {
	siteTitle: PropTypes.string.isRequired,
};

export { IntroPage };
