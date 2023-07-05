import { getRedirectUrl } from '@automattic/jetpack-components';
import { useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Card from 'components/card';
import QuerySite from 'components/data/query-site';
import SettingsCard from 'components/settings-card';
import SettingsGroup from 'components/settings-group';
import analytics from 'lib/analytics';
import { FEATURE_SIMPLE_PAYMENTS_JETPACK } from 'lib/plans/constants';
import React from 'react';
import { connect } from 'react-redux';
import {
	isOfflineMode,
	isUnavailableInOfflineMode as isUnavailableInOfflineModeSelector,
} from 'state/connection';
import { isAtomicSite as isAtomicSiteSelector } from 'state/initial-state';
import { getModule } from 'state/modules';
import { isModuleFound as isModuleFoundSelector } from 'state/search';
import { Ads } from './ads';

/**
 * Earn Feature description card.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Feature description and CTA.
 */
function EarnFeatureButton( props ) {
	const { buttonText, featureName, infoLink, infoDescription, title } = props;

	const trackButtonClick = useCallback( () => {
		analytics.tracks.recordJetpackClick( {
			target: `visit-${ featureName }`,
			feature: 'earn',
		} );
	}, [ featureName ] );

	return (
		<SettingsCard
			{ ...props }
			header={ title }
			hideButton
			module="earn"
			feature={ FEATURE_SIMPLE_PAYMENTS_JETPACK }
		>
			<SettingsGroup
				support={ {
					link: infoLink,
				} }
			>
				{ infoDescription }
			</SettingsGroup>
			<Card
				compact
				className="jp-settings-card__configure-link"
				onClick={ trackButtonClick }
				href={ getRedirectUrl( 'wpcom-earn-payments', {
					site: props.siteRawUrl,
				} ) }
				target="_blank"
			>
				{ buttonText }
			</Card>
		</SettingsCard>
	);
}

/**
 * Earn Section.
 *
 * @param {object} props - Component props.
 * @returns {React.Component} Earn settings component.
 */
function Earn( props ) {
	const { active, isModuleFound, isOffline, searchTerm, siteRawUrl } = props;

	const foundAds = isModuleFound( 'wordads' );

	if ( ! searchTerm && ! active ) {
		return null;
	}

	const paymentBlocks = () => {
		if ( isOffline ) {
			return (
				<SettingsGroup>
					<div className="jp-form-block-fade" />
					{ __( 'Unavailable in Offline Mode.', 'jetpack' ) }
				</SettingsGroup>
			);
		}

		return (
			<>
				<EarnFeatureButton
					{ ...props }
					featureName="payments"
					title={ __( 'Collect payments', 'jetpack' ) }
					infoLink={ getRedirectUrl( 'wpcom-payments-donations' ) }
					infoDescription={ __(
						'Let visitors pay for digital goods and services or make quick, pre-set donations by enabling the Payment Button block.',
						'jetpack'
					) }
					buttonText={ __( 'Enable Payment Button', 'jetpack' ) }
				/>
				<EarnFeatureButton
					{ ...props }
					featureName="donations"
					title={ __( 'Accept donations and tips', 'jetpack' ) }
					infoLink={ getRedirectUrl( 'wpcom-payments-donations' ) }
					infoDescription={ __(
						'Accept one-time and recurring donations by enabling the Donations Form block.',
						'jetpack'
					) }
					buttonText={ __( 'Enable Donations Form', 'jetpack' ) }
				/>
				<EarnFeatureButton
					{ ...props }
					featureName="paypal"
					title={ __( 'Collect PayPal payments', 'jetpack' ) }
					infoLink={ getRedirectUrl( 'jetpack-support-pay-with-paypal' ) }
					infoDescription={ __(
						'Accept credit card payments via PayPal for physical products, services, donations, or support of your creative work.',
						'jetpack'
					) }
					buttonText={ __( 'Learn how to get started', 'jetpack' ) }
				/>
			</>
		);
	};

	return (
		<div>
			<QuerySite />
			<h1 className="screen-reader-text">{ __( 'Jetpack Earn Settings', 'jetpack' ) }</h1>
			<h2 className="jp-settings__section-title">
				{ searchTerm
					? __( 'Earn', 'jetpack' )
					: __(
							'Explore tools to earn money with your site.',
							'jetpack',
							/* dummy arg to avoid bad minification */ 0
					  ) }
			</h2>
			{ foundAds && (
				<Ads
					{ ...props }
					configureUrl={ getRedirectUrl( 'calypso-stats-ads-day', {
						site: siteRawUrl,
					} ) }
				/>
			) }
			{ paymentBlocks() }
		</div>
	);
}

export default connect( state => {
	return {
		module: module_name => getModule( state, module_name ),
		isOffline: isOfflineMode( state ),
		isModuleFound: module_name => isModuleFoundSelector( state, module_name ),
		isUnavailableInOfflineMode: module_name =>
			isUnavailableInOfflineModeSelector( state, module_name ),
		isAtomicSite: isAtomicSiteSelector( state ),
	};
} )( Earn );
