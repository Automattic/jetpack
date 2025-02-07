import {
	Text,
	Button,
	Title,
	getRedirectUrl,
	ContextualUpgradeTrigger,
	Col,
	Container,
} from '@automattic/jetpack-components';
import { __, sprintf } from '@wordpress/i18n';
import React, { useCallback } from 'react';
import SeventyFiveLayout from '../../components/seventy-five-layout';
import useAnalyticsTracks from '../../hooks/use-analytics-tracks';
import usePlan from '../../hooks/use-plan';
import useWafData from '../../hooks/use-waf-data';
import styles from './styles.module.scss';

const ProductPromotion = () => {
	const { recordEvent } = useAnalyticsTracks();
	const { hasPlan, upgradePlan } = usePlan();
	const { siteSuffix, blogID } = window.jetpackProtectInitialState || {};

	const getScan = useCallback( () => {
		recordEvent( 'jetpack_protect_footer_get_scan_link_click' );
		upgradePlan();
	}, [ recordEvent, upgradePlan ] );

	if ( hasPlan ) {
		const goToCloudUrl = getRedirectUrl( 'jetpack-scan-dash', { site: blogID ?? siteSuffix } );

		return (
			<div className={ styles[ 'product-section' ] }>
				<Title>{ __( 'Get access to our Cloud', 'jetpack-protect' ) }</Title>
				<Text mb={ 3 }>
					{ __(
						'With your Protect upgrade, you have free access to scan your site on our Cloud, so you can be aware and fix your threats even if your site goes down.',
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
	const { hasPlan } = usePlan();
	const { globalStats } = useWafData();
	const totalVulnerabilities = parseInt( globalStats?.totalVulnerabilities );
	const totalVulnerabilitiesFormatted = isNaN( totalVulnerabilities )
		? '50,000'
		: totalVulnerabilities.toLocaleString();

	if ( hasPlan ) {
		const learnMoreScanUrl = getRedirectUrl( 'protect-footer-learn-more-scan' );

		return (
			<div className={ styles[ 'info-section' ] }>
				<Title>{ __( 'Line-by-line scanning', 'jetpack-protect' ) }</Title>
				<Text mb={ 2 }>
					{ __(
						'We actively review line-by-line of your site files to identify threats and vulnerabilities. Jetpack monitors millions of websites to keep your site secure all the time.',
						'jetpack-protect'
					) }{ ' ' }
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
			<Title>
				{ sprintf(
					// translators: placeholder is the number of total vulnerabilities i.e. "22,000".
					__( 'Over %s listed vulnerabilities', 'jetpack-protect' ),
					totalVulnerabilitiesFormatted
				) }
			</Title>
			<Text mb={ 3 }>
				{ sprintf(
					// translators: placeholder is the number of total vulnerabilities i.e. "22,000".
					__(
						'Every day we check your plugin, theme, and WordPress versions against our %s listed vulnerabilities powered by WPScan, an Automattic brand.',
						'jetpack-protect'
					),
					totalVulnerabilitiesFormatted
				) }
			</Text>

			<Button variant="link" isExternalLink={ true } href={ learnMoreProtectUrl } weight="regular">
				{ __( 'Learn more', 'jetpack-protect' ) }
			</Button>
		</div>
	);
};

const ScanFooter = () => {
	const { waf } = window.jetpackProtectInitialState || {};
	return waf.wafSupported ? (
		<SeventyFiveLayout
			main={ <ProductPromotion /> }
			secondary={ <FooterInfo /> }
			preserveSecondaryOnMobile={ true }
		/>
	) : (
		<Container horizontalSpacing={ 0 } horizontalGap={ 0 } fluid={ false }>
			<Col>
				<FooterInfo />
			</Col>
		</Container>
	);
};

export default ScanFooter;
