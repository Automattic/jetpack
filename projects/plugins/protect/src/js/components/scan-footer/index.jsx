import {
	Text,
	Button,
	Title,
	getRedirectUrl,
	ContextualUpgradeTrigger,
} from '@automattic/jetpack-components';
import { useProductCheckoutWorkflow } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import React from 'react';
import { JETPACK_SCAN_SLUG } from '../../constants';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import useProtectData from '../../hooks/use-protect-data';
import SeventyFiveLayout from '../seventy-five-layout';
import styles from './styles.module.scss';

const ProductPromotion = () => {
	const { adminUrl, siteSuffix } = window.jetpackProtectInitialState || {};

	const { run } = useProductCheckoutWorkflow( {
		productSlug: JETPACK_SCAN_SLUG,
		redirectUrl: adminUrl,
	} );

	const { recordEventHandler } = useAnalyticsTracks();
	const getScan = recordEventHandler( 'jetpack_protect_footer_get_scan_link_click', run );

	const { hasRequiredPlan } = useProtectData();

	if ( hasRequiredPlan ) {
		const goToCloudUrl = getRedirectUrl( 'jetpack-scan-dash', { site: siteSuffix } );

		return (
			<div className={ styles[ 'product-section' ] }>
				<Title>{ __( 'Get access to our Cloud', 'jetpack-protect' ) }</Title>
				<Text mb={ 3 }>
					{ __(
						'With your Protect upgrade, you have free access to scan your site on our Cloud, so you can be aware and fix your threats even if your site goes down. ',
						'jetpack-protect'
					) }
				</Text>

				<Button variant="secondary" weight="regular" href={ goToCloudUrl }>
					{ __( 'Go to Cloud', 'jetpack-protect' ) }
				</Button>
			</div>
		);
	}

	return (
		<div className={ styles[ 'product-section' ] }>
			<Title>{ __( 'Advanced scan results', 'jetpack-protect' ) }</Title>
			<Text mb={ 3 }>
				{ __(
					'Upgrade Jetpack Protect to get advanced scan tools, including one-click fixes for most threats and malware scanning.',
					'jetpack-protect'
				) }
			</Text>

			<ContextualUpgradeTrigger
				description={ __(
					'Looking for advanced scan results and one-click fixes?',
					'jetpack-protect'
				) }
				cta={ __( 'Upgrade Jetpack Protect now', 'jetpack-protect' ) }
				onClick={ getScan }
			/>
		</div>
	);
};

const FooterInfo = () => {
	const { hasRequiredPlan } = useProtectData();

	if ( hasRequiredPlan ) {
		const learnMoreScanUrl = getRedirectUrl( 'protect-footer-learn-more-scan' );

		return (
			<div className={ styles[ 'info-section' ] }>
				<Title>{ __( 'Line-by-line scanning', 'jetpack-protect' ) }</Title>
				<Text mb={ 2 }>
					{ __(
						'We actively review line-by-line of your site files to identify threats and vulnerabilities. Jetpack monitors millions of websites to keep your site secure all the time. ',
						'jetpack-protect'
					) }
					<Button variant="link" target="_blank" weight="regular" href={ learnMoreScanUrl }>
						{ __( 'Learn more', 'jetpack-protect' ) }
					</Button>
				</Text>
			</div>
		);
	}

	const learnMoreProtectUrl = getRedirectUrl( 'jetpack-protect-footer-learn-more' );

	return (
		<div className={ styles[ 'info-section' ] }>
			<Title>{ __( 'Over 22,000 listed vulnerabilities', 'jetpack-protect' ) }</Title>
			<Text mb={ 3 }>
				{ __(
					'Every day we check your plugin, theme, and WordPress versions against our 22,000 listed vulnerabilities powered by WPScan, an Automattic brand.',
					'jetpack-protect'
				) }
			</Text>

			<Button variant="link" isExternalLink={ true } href={ learnMoreProtectUrl } weight="regular">
				{ __( 'Learn more', 'jetpack-protect' ) }
			</Button>
		</div>
	);
};

const ScanFooter = () => {
	return (
		<SeventyFiveLayout
			main={ <ProductPromotion /> }
			secondary={ <FooterInfo /> }
			preserveSecondaryOnMobile={ true }
		/>
	);
};

export default ScanFooter;
