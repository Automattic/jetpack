/**
 * External dependencies
 */
import { AdminPage, Col, Container, getRedirectUrl } from '@automattic/jetpack-components';
import { formatNumberCompact } from '@automattic/number-formatters';
import { Button, Card } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, check, shield, login } from '@wordpress/icons';
import { Link } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback, useEffect } from 'react';
/**
 * Internal dependencies
 */
import { MyJetpackRoutes } from '../../../constants';
import { QUERY_GET_PROTECT_DATA_KEY, REST_API_GET_PROTECT_DATA } from '../../../data/constants';
import useProduct from '../../../data/products/use-product';
import useSimpleQuery from '../../../data/use-simple-query';
import useAnalytics from '../../../hooks/use-analytics';
import { useGoBack } from '../../../hooks/use-go-back';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import useMyJetpackNavigate from '../../../hooks/use-my-jetpack-navigate';
import GoBackLink from '../../go-back-link';
import LoadingBlock from '../../loading-block';
import styles from './style.module.scss';

/**
 * Product Page for Jetpack Protect (non-standalone plugin users)
 *
 * This page is shown when users click "View" on the Protect card but don't have
 * the standalone Protect plugin installed. It explains their current protection
 * status and the difference between free vulnerability scanning and paid malware scanning.
 *
 * @return {object} React component for the product page
 */
export default function ProtectProductPage() {
	const { onClickGoBack } = useGoBack( { slug: 'protect', fallback: '/products' } );
	const { detail, isLoading: isLoadingProduct } = useProduct( 'protect' );
	const { isSiteConnected } = useMyJetpackConnection();
	const { recordEvent } = useAnalytics();
	const navigateToUpgrade = useMyJetpackNavigate( MyJetpackRoutes.AddProtect );

	const { data: protectData, isLoading: isLoadingProtectData } = useSimpleQuery< ProtectData >( {
		name: QUERY_GET_PROTECT_DATA_KEY,
		query: {
			path: REST_API_GET_PROTECT_DATA,
		},
	} );

	const isLoading = isLoadingProduct || isLoadingProtectData;

	// Extract data for display
	const { plugins = [], themes = [] } = protectData?.scanData || {};
	const blockedLogins = protectData?.wafConfig?.blocked_logins || 0;
	const hasBruteForceProtection = protectData?.wafConfig?.brute_force_protection || false;
	const isWafEnabled = protectData?.wafConfig?.waf_enabled || false;

	const totalExtensionsChecked = plugins.length + themes.length;
	const hasPaidPlan = detail?.hasPaidPlanForProduct || false;

	// Track page view
	useEffect( () => {
		recordEvent( 'jetpack_protect_myjetpack_product_page_view', {
			has_paid_plan: hasPaidPlan,
			is_connected: isSiteConnected,
		} );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] ); // track only on page load

	const handleUpgradeClick = useCallback( () => {
		recordEvent( 'jetpack_protect_upgrade_button', {
			placement: 'product-page',
			context: 'my-jetpack',
		} );
		navigateToUpgrade();
	}, [ recordEvent, navigateToUpgrade ] );

	const cloudScanUrl = getRedirectUrl( 'my-jetpack-manage-scan' );
	const scanVsProtectUrl = getRedirectUrl( 'jetpack-protect-support', {
		anchor: 'jetpack-protect-jetpack-scan-and-wpscan-understand-the-difference',
	} );
	const securityFeaturesUrl = getRedirectUrl( 'jetpack-security' );

	return (
		<AdminPage
			showBackground={ true }
			breadcrumbs={
				<GoBackLink
					onClick={ onClickGoBack }
					to="/products"
					label={ __( 'My Jetpack', 'jetpack-my-jetpack' ) }
				/>
			}
		>
			<Container fluid horizontalSpacing={ 3 } horizontalGap={ 2 }>
				{ /* Hero Section */ }
				<Col className={ clsx( styles[ 'product-interstitial__section' ] ) }>
					<div className={ styles[ 'product-interstitial__hero-section' ] }>
						<div className={ styles[ 'product-interstitial__hero-content' ] }>
							{ isLoading ? (
								<LoadingBlock height="80px" width="100%" />
							) : (
								<h1 className={ styles[ 'product-interstitial__hero-heading' ] }>
									{ __( 'Your site is protected', 'jetpack-my-jetpack' ) }
								</h1>
							) }

							<div className={ styles[ 'product-interstitial__hero-sub-heading' ] }>
								{ __(
									'Jetpack is actively monitoring your site for security vulnerabilities and blocking malicious login attempts. Your plugins and themes are checked daily against a database of known vulnerabilities.',
									'jetpack-my-jetpack'
								) }
							</div>

							{ ! hasPaidPlan && (
								<Button variant="primary" onClick={ handleUpgradeClick }>
									{ __( 'Upgrade', 'jetpack-my-jetpack' ) }
								</Button>
							) }
							{ hasPaidPlan && (
								<Button variant="primary" href={ cloudScanUrl }>
									{ __( 'View scan results on Jetpack Cloud', 'jetpack-my-jetpack' ) }
								</Button>
							) }
						</div>

						{ /* Stats Cards */ }
						<div className={ styles[ 'product-interstitial__hero-side' ] }>
							{ isLoading ? (
								<LoadingBlock height="168px" width="168px" />
							) : (
								<Card className={ styles[ 'stats-card' ] }>
									<Icon icon={ shield } className={ styles[ 'stats-card-icon-check' ] } />
									<div>
										<div className={ styles[ 'product-interstitial__stats-card-text' ] }>
											{ __( 'Extensions checked', 'jetpack-my-jetpack' ) }
										</div>
										<div className={ styles[ 'product-interstitial__stats-card-value' ] }>
											{ totalExtensionsChecked }
										</div>
									</div>
								</Card>
							) }

							{ isLoading ? (
								<LoadingBlock height="168px" width="168px" />
							) : (
								<Card className={ styles[ 'stats-card' ] }>
									<Icon icon={ login } className={ styles[ 'stats-card-icon-check' ] } />
									<div>
										<div className={ styles[ 'product-interstitial__stats-card-text' ] }>
											{ __( 'Logins blocked', 'jetpack-my-jetpack' ) }
										</div>
										<div className={ styles[ 'product-interstitial__stats-card-value' ] }>
											{ formatNumberCompact( blockedLogins ) }
										</div>
									</div>
								</Card>
							) }
						</div>
					</div>
				</Col>

				{ /* What's Included Section */ }
				<Col className={ styles[ 'product-interstitial__section' ] }>
					<div className={ styles[ 'product-interstitial__section-wrapper' ] }>
						<h2 className={ styles[ 'product-interstitial__section-heading' ] }>
							{ __( "What's included for free", 'jetpack-my-jetpack' ) }
						</h2>
						<p className={ styles[ 'product-interstitial__section-sub-heading' ] }>
							{ __(
								'Your site benefits from these security features at no cost.',
								'jetpack-my-jetpack'
							) }
						</p>

						<div className={ styles[ 'product-interstitial__features-list' ] }>
							<div className={ styles[ 'product-interstitial__feature-item' ] }>
								<Icon icon={ check } className={ styles[ 'feature-icon' ] } />
								<div>
									<strong>{ __( 'Vulnerability scanning', 'jetpack-my-jetpack' ) }</strong>
									<p>
										{ __(
											'Daily checks of your plugins, themes, and WordPress core against a database of known vulnerabilities.',
											'jetpack-my-jetpack'
										) }
									</p>
								</div>
							</div>

							<div className={ styles[ 'product-interstitial__feature-item' ] }>
								<Icon icon={ check } className={ styles[ 'feature-icon' ] } />
								<div>
									<strong>{ __( 'Brute force protection', 'jetpack-my-jetpack' ) }</strong>
									<p>
										{ __(
											'Automatic blocking of malicious login attempts to keep hackers out of your site.',
											'jetpack-my-jetpack'
										) }
									</p>
									{ hasBruteForceProtection ? (
										<span className={ styles[ 'status-active' ] }>
											{ __( 'Active', 'jetpack-my-jetpack' ) }
										</span>
									) : (
										<span className={ styles[ 'status-inactive' ] }>
											{ __( 'Inactive', 'jetpack-my-jetpack' ) }
										</span>
									) }
								</div>
							</div>

							<div className={ styles[ 'product-interstitial__feature-item' ] }>
								<Icon icon={ check } className={ styles[ 'feature-icon' ] } />
								<div>
									<strong>{ __( 'Web Application Firewall', 'jetpack-my-jetpack' ) }</strong>
									<p>
										{ __(
											'Basic firewall protection with manual rules to filter malicious traffic.',
											'jetpack-my-jetpack'
										) }
									</p>
									{ isWafEnabled ? (
										<span className={ styles[ 'status-active' ] }>
											{ __( 'Active', 'jetpack-my-jetpack' ) }
										</span>
									) : (
										<span className={ styles[ 'status-inactive' ] }>
											{ __( 'Inactive', 'jetpack-my-jetpack' ) }
										</span>
									) }
								</div>
							</div>
						</div>
					</div>
				</Col>

				{ /* Understanding Your Status Section */ }
				<Col className={ styles[ 'product-interstitial__section' ] }>
					<div className={ styles[ 'product-interstitial__section-wrapper' ] }>
						<h2 className={ styles[ 'product-interstitial__section-heading' ] }>
							{ __( 'Upgrade for full protection', 'jetpack-my-jetpack' ) }
						</h2>
						<p className={ styles[ 'product-interstitial__section-sub-heading' ] }>
							{ __(
								'Jetpack Scan is a paid upgrade that provides real-time malware scanning and an enhanced web application firewall (WAF) while also enabling auto-fixes (where available) for security threats.',
								'jetpack-my-jetpack'
							) }
						</p>

						<div className={ styles[ 'product-interstitial__comparison' ] }>
							<div className={ styles[ 'product-interstitial__comparison-item' ] }>
								<h3>{ __( 'Vulnerability scanning (Free)', 'jetpack-my-jetpack' ) }</h3>
								<p>
									{ __(
										'Compares your installed plugins, themes, and WordPress version against a database of known security vulnerabilities. This helps identify outdated or vulnerable software.',
										'jetpack-my-jetpack'
									) }
								</p>
							</div>

							<div className={ styles[ 'product-interstitial__comparison-item' ] }>
								<h3>{ __( 'Malware scanning (Paid)', 'jetpack-my-jetpack' ) }</h3>
								<p>
									{ __(
										'Deep, line-by-line scanning of your site files to detect malware, backdoors, and malicious code. Includes automatic fixes and real-time notifications.',
										'jetpack-my-jetpack'
									) }
								</p>
								<Button variant="primary" onClick={ handleUpgradeClick }>
									{ __( 'Upgrade', 'jetpack-my-jetpack' ) }
								</Button>
							</div>
						</div>

						<p>
							<Link openInNewTab href={ scanVsProtectUrl }>
								{ __(
									'Learn more about the difference between Protect and Scan',
									'jetpack-my-jetpack'
								) }
							</Link>
						</p>
					</div>
				</Col>

				{ /* Upgrade Section */ }
				{ ! hasPaidPlan && (
					<Col className={ styles[ 'product-interstitial__section' ] }>
						<div className={ styles[ 'product-interstitial__section-wrapper' ] }>
							<h2 className={ styles[ 'product-interstitial__section-heading' ] }>
								{ __( 'Want comprehensive protection?', 'jetpack-my-jetpack' ) }
							</h2>
							<p className={ styles[ 'product-interstitial__section-sub-heading' ] }>
								{ __(
									'Jetpack Security provides easy-to-use, comprehensive WordPress site security, including real-time backups, a web application firewall, malware scanning, and spam protection.',
									'jetpack-my-jetpack'
								) }
							</p>
							<div className={ styles[ 'product-interstitial__cta-buttons' ] }>
								<Button variant="primary" onClick={ handleUpgradeClick }>
									{ __( 'Secure your site', 'jetpack-my-jetpack' ) }
								</Button>
								<Link openInNewTab href={ securityFeaturesUrl }>
									{ __( 'Learn more about Jetpack Security', 'jetpack-my-jetpack' ) }
								</Link>
							</div>
						</div>
					</Col>
				) }
			</Container>
		</AdminPage>
	);
}
