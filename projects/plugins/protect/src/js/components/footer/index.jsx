import { Text, Button, Title, IconsCard, getRedirectUrl } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import React from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import { JETPACK_SCAN, SeventyFiveLayout } from '../admin-page';
import styles from './styles.module.scss';

const ProductPromotion = () => {
	const { adminUrl } = window.jetpackProtectInitialState || {};

	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN,
		redirectUrl: adminUrl,
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getJetpackScan = recordEventHandler( 'jetpack_protect_footer_get_scan_link_click', run );

	const { jetpackScan } = useProtectData();
	const { hasRequiredPlan } = jetpackScan;

	if ( hasRequiredPlan ) {
		const getStartedUrl = getRedirectUrl( 'protect-footer-get-started-scan' );

		return (
			<div className={ styles[ 'product-section' ] }>
				<IconsCard products={ [ 'scan' ] } />
				<Title>
					{ __( 'Learn how Jetpack Scan increases your site protection', 'jetpack-protect' ) }
				</Title>
				<Text mb={ 3 }>
					{ __(
						'Keep your site or store ahead of security threats with automated malware scanning; including one-click fixes.',
						'jetpack-protect'
					) }
				</Text>

				<Button variant="link" isExternalLink={ true } weight="regular" href={ getStartedUrl }>
					{ __( 'Get Started', 'jetpack-protect' ) }
				</Button>
			</div>
		);
	}

	return (
		<div className={ styles[ 'product-section' ] }>
			<IconsCard products={ [ 'scan' ] } />
			<Title>{ __( 'We guard your site. You run your business.', 'jetpack-protect' ) }</Title>
			<Text mb={ 3 }>
				{ __(
					'Jetpack Scan uses automated scanning and one‑click fixes to keep your site ahead of security threats..',
					'jetpack-protect'
				) }
			</Text>

			<Button variant="secondary" onClick={ getJetpackScan } isLoading={ hasCheckoutStarted }>
				{ __( 'Get Jetpack Scan', 'jetpack-protect' ) }
			</Button>
		</div>
	);
};

const FooterInfo = () => {
	const learnMoreUrl = getRedirectUrl( 'jetpack-protect-footer-learn-more' );

	return (
		<div className={ styles[ 'info-section' ] }>
			<Title>{ __( 'Over 22,000 listed vulnerabilities', 'jetpack-protect' ) }</Title>
			<Text mb={ 3 }>
				{ __(
					'Every day we check your plugin, theme, and WordPress versions against our 22,000 listed vulnerabilities powered by WPScan, an Automattic brand.',
					'jetpack-protect'
				) }
			</Text>
			<Button variant="link" isExternalLink={ true } href={ learnMoreUrl } weight="regular">
				{ __( 'Learn more', 'jetpack-protect' ) }
			</Button>
		</div>
	);
};

const Footer = () => {
	return (
		<SeventyFiveLayout
			main={ <ProductPromotion /> }
			secondary={ <FooterInfo /> }
			preserveSecondaryOnMobile={ true }
		/>
	);
};

export default Footer;
