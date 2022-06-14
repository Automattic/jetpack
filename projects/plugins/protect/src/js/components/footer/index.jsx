import { Text, Button, Title, IconsCard, getRedirectUrl } from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import React from 'react';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import { SECURITY_BUNDLE, SeventyFiveLayout } from '../admin-page';
import styles from './styles.module.scss';

const ProductPromotion = () => {
	const { adminUrl } = window.jetpackProtectInitialState || {};

	const { run, hasCheckoutStarted } = useProductCheckoutWorkflow( {
		productSlug: SECURITY_BUNDLE,
		redirectUrl: adminUrl,
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getSecurityBundle = recordEventHandler(
		'jetpack_protect_footer_get_security_link_click',
		run
	);

	const { securityBundle } = useProtectData();
	const { hasRequiredPlan } = securityBundle;

	if ( hasRequiredPlan ) {
		const getStartedUrl = getRedirectUrl( 'protect-footer-get-started-scan' );

		return (
			<div className={ styles[ 'product-section' ] }>
				<IconsCard products={ [ 'backup', 'scan', 'anti-spam' ] } />
				<Title>
					{ __( 'Learn how Jetpack Scan increases your site protection', 'jetpack-protect' ) }
				</Title>
				<Text mb={ 3 }>
					{ __(
						'With your Jetpack Security bundle you have access to Jetpack Scan. Automatically scan your site from the Cloud, get email notifications and perform one-click fixes.',
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
			<Title>{ __( 'Comprehensive Site Security', 'jetpack-protect' ) }</Title>
			<Text mb={ 3 }>
				{ __(
					'Jetpack Security offers advanced scan tools, including one-click fixes for most threats and malware scanning. Plus, with this bundle you also get real-time cloud backups and spam protection.',
					'jetpack-protect'
				) }
			</Text>

			<Button variant="secondary" onClick={ getSecurityBundle } isLoading={ hasCheckoutStarted }>
				{ __( 'Get Jetpack Security', 'jetpack-protect' ) }
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
