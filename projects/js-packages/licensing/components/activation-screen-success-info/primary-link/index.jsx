import { getRedirectUrl } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import PropTypes from 'prop-types';
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
	const isJetpackProtectActive = isPluginActive( 'Jetpack Protect' );

	// The success-screen CTAs only navigate the current tab. Using onClick keeps
	// a native @wordpress/ui <button> (so its styles render untouched) rather
	// than rendering it as an anchor.
	// TODO: replace these onClick navigations with @wordpress/ui `LinkButton` once it ships (Gutenberg #77098).
	const navigateTo = url => () => {
		window.location.href = url;
	};

	if ( isFetching ) {
		return (
			<Button
				className="jp-license-activation-screen-success-info--button"
				loading
				loadingAnnouncement={ __( 'Loading…', 'jetpack-licensing' ) }
				aria-label={ __( 'Loading…', 'jetpack-licensing' ) }
			/>
		);
	}

	if ( isJetpackSocialProduct && ( isJetpackActive || isJetpackSocialActive ) ) {
		return (
			<Button
				className="jp-license-activation-screen-success-info--button"
				onClick={ navigateTo(
					siteAdminUrl +
						( isJetpackActive
							? 'admin.php?page=jetpack#/recommendations/' +
							  ( productGroup === 'jetpack_social_advanced'
									? 'welcome-social-advanced'
									: 'welcome-social-basic' )
							: 'admin.php?page=jetpack-social' )
				) }
			>
				{ __( 'Configure my site', 'jetpack-licensing' ) }
			</Button>
		);
	}

	if ( productGroup === 'jetpack_scan' ) {
		const redirectSource = isJetpackProtectActive
			? siteAdminUrl + 'admin.php?page=jetpack-protect'
			: getRedirectUrl( 'jetpack-license-activation-success-scan', { site: siteRawUrl } );
		return (
			<Button
				className="jp-license-activation-screen-success-info--button"
				onClick={ navigateTo( redirectSource ) }
			>
				{ __( 'View scan results', 'jetpack-licensing' ) }
			</Button>
		);
	}

	// If the user has not completed the first step of the Assistant, make the primary button link to it.
	if ( currentRecommendationsStep === 'not-started' ) {
		return (
			<Button
				className="jp-license-activation-screen-success-info--button"
				onClick={ navigateTo( siteAdminUrl + 'admin.php?page=jetpack#/recommendations' ) }
			>
				{ __( 'Configure my site', 'jetpack-licensing' ) }
			</Button>
		);
	}

	return (
		<Button
			className="jp-license-activation-screen-success-info--button"
			onClick={ navigateTo(
				getRedirectUrl( 'license-activation-view-my-plans', { site: siteRawUrl } )
			) }
		>
			{ __( 'View my plans', 'jetpack-licensing' ) }
		</Button>
	);
};

PrimaryLink.propTypes = {
	siteAdminUrl: PropTypes.string.isRequired,
	currentRecommendationsStep: PropTypes.string,
	siteRawUrl: PropTypes.string.isRequired,
};

export { PrimaryLink };
