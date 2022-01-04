/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/components';
import PropTypes from 'prop-types';
import React from 'react';

/**
 * Style dependencies
 */
import './style.scss';

const PrimaryLink = props => {
	const { currentRecommendationsStep, siteAdminUrl } = props;

	const linkToMyPlanSection = currentRecommendationsStep !== 'not-started';

	const buttonLink = linkToMyPlanSection
			? siteAdminUrl + 'admin.php?page=jetpack#/my-plan'
			: siteAdminUrl + 'admin.php?page=jetpack#/recommendations';

	return (
		<Button className="jp-license-activation-screen-success-info--button" href={ buttonLink }>
			{ linkToMyPlanSection
				? __( 'View my plans', 'jetpack' )
				: __( 'Configure my site', 'jetpack' )
			}
		</Button>
	);
};

PrimaryLink.propTypes = {
	siteAdminUrl: PropTypes.string.isRequired,
	currentRecommendationsStep: PropTypes.string,
};

export { PrimaryLink };
