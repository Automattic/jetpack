import { Spinner, getRedirectUrl } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import useActivePlugins from '../../../hooks/use-active-plugins';
import { getProductGroup } from '../../activation-screen/utils';

import './style.scss';

const PrimaryLink = props => {
	const { currentRecommendationsStep, siteAdminUrl, siteRawUrl, productId } = props;
	const [ activePlugins, isFetching ] = useActivePlugins();

	const isPluginActive = pluginName =>
		activePlugins.map( plugin => plugin.name ).includes( pluginName );

	const productGroup = getProductGroup( productId );
	const isJetpackActive = isPluginActive( 'Jetpack' );
	const isJetpackSocialActive = isPluginActive( 'Jetpack Social' );
	const isJetpackSocialProduct =
		productGroup === 'jetpack_social_advanced' || productGroup === 'jetpack_social_basic';

	if ( isFetching ) {
		return (
			<Button className="jp-license-activation-screen-success-info--button">
				<Spinner />
			</Button>
		);
	}

	if ( isJetpackSocialProduct && ( isJetpackActive || isJetpackSocialActive ) ) {
		return (
			<Button
				className="jp-license-activation-screen-success-info--button"
				href={
					siteAdminUrl +
					( isJetpackActive
						? 'admin.php?page=jetpack#/recommendations/' +
						  ( productGroup === 'jetpack_social_advanced'
								? 'welcome-social-advanced'
								: 'welcome-social-basic' )
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
