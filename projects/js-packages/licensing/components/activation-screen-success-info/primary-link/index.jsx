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
	const { initialStateRecommendationsStep } = props;

	const buttonLabel =
		initialStateRecommendationsStep !== 'not-started'
			? __( 'View my plans', 'jetpack' )
			: __( 'Configure my site', 'jetpack' );

	const buttonLink =
		initialStateRecommendationsStep !== 'not-started'
			? '/wp-admin/admin.php?page=jetpack#/my-plan'
			: '/wp-admin/admin.php?page=jetpack#/recommendations';

	return (
		<Button className="jp-license-activation-screen-success-info--button" href={ buttonLink }>
			{ buttonLabel }
		</Button>
	);
};

PrimaryLink.propTypes = {
	initialStateRecommendationsStep: PropTypes.string,
};

export { PrimaryLink };
