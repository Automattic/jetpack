/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import QuerySite from 'components/data/query-site';
import { imagePath } from 'constants/urls';
import { getSiteRawUrl } from 'state/initial-state';

const SetupWizardComponent = props => {
	return (
		<>
			<QuerySite />
			<div className="jp-setup-wizard-intro">
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
					{ __(
						'Jetpack is a cloud-powered tool built by Automattic and brought to you by Bluehost.'
					) }
				</p>
				<p className="jp-setup-wizard-paragraph">
					{ __(
						'Answer a few questions and we’ll help you secure, speed up, customize, and grow your WordPress website.'
					) }
				</p>
				<div className="jp-setup-wizard-intro-question">
					<h2>
						{ __( 'What will %(siteUrl)s be used for?', { args: { siteUrl: props.siteRawUrl } } ) }
					</h2>
					<div>
						<Button primary className="jp-setup-wizard-button">
							{ __( 'Personal Use' ) }
						</Button>
						<Button className="jp-setup-wizard-button" primary>
							{ __( 'Business Use' ) }
						</Button>
					</div>
					<a className="jp-setup-wizard-skip-link" href="">
						{ __( 'Skip to recommended features' ) }
					</a>
				</div>
			</div>
		</>
	);
};

export const SetupWizard = connect( state => {
	return { siteRawUrl: getSiteRawUrl( state ) };
} )( SetupWizardComponent );
