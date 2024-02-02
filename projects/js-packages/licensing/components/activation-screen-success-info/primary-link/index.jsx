import { getRedirectUrl } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import { getProductGroup, isPluginActive } from '../../activation-screen/utils';

import './style.scss';

const PrimaryLink = props => {
	const { currentRecommendationsStep, siteAdminUrl, siteRawUrl, productId } = props;

	const productGroup = getProductGroup( productId );
	if (
		productGroup === 'jetpack_social_advanced' &&
		( isPluginActive( 'jetpack/jetpack.php' ) || isPluginActive( 'jetpack/jetpack-social.php' ) )
	) {
		return (
			<Button
				className="jp-license-activation-screen-success-info--button"
				href={
					siteAdminUrl +
					( isPluginActive( 'jetpack/jetpack.php' )
						? 'admin.php?page=jetpack#/recommendations/welcome-social-advanced'
						: 'admin.php?page=jetpack-social' )
				}
			>
				{ __( 'Configure my site', 'jetpack' ) }
			</Button>
		);
	}

	if (
		productGroup === 'jetpack_social_basic' &&
		( isPluginActive( 'jetpack/jetpack.php' ) || isPluginActive( 'jetpack/jetpack-social.php' ) )
	) {
		return (
			<Button
				className="jp-license-activation-screen-success-info--button"
				href={
					siteAdminUrl +
					( isPluginActive( 'jetpack/jetpack.php' )
						? 'admin.php?page=jetpack#/recommendations/welcome-social-basic'
						: 'admin.php?page=jetpack-social' )
				}
			>
				{ __( 'Configure my site', 'jetpack' ) }
			</Button>
		);
	}

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
	currentRecommendationsStep: PropTypes.string,
	siteRawUrl: PropTypes.string.isRequired,
};

export { PrimaryLink };
