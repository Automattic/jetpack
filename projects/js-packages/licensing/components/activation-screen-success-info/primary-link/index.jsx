/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import PropTypes from 'prop-types';
import React from 'react';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Style dependencies
 */
import './style.scss';

const PrimaryLink = props => {
	const { currentRecommendationsStep, siteAdminUrl, siteRawUrl } = props;

	// If the user has not completed the first step of the Assistant, make the primary button link to it.
	if ( currentRecommendationsStep === 'not-started' ) {
		return (
			<Button
				className="jp-license-activation-screen-success-info--button"
				href={ siteAdminUrl + 'admin.php?page=jetpack#/recommendations' }
			>
				{ __( 'Configure my site', 'jetpack' ) }
			</Button>
		);
	}

	return (
		<Button
			className="jp-license-activation-screen-success-info--button"
			href={ getRedirectUrl( 'license-activation-view-my-plans', { site: siteRawUrl } ) }
		>
			{ __( 'View my plans', 'jetpack' ) }
		</Button>
	);
};

PrimaryLink.propTypes = {
	siteAdminUrl: PropTypes.string.isRequired,
	siteRawUrl: PropTypes.string.isRequired,
	currentRecommendationsStep: PropTypes.string,
};

export { PrimaryLink };
