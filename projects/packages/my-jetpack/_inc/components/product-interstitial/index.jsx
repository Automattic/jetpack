import { AdminPage, Button, Col, Container, Text } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import React, { useCallback, useEffect } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackNavigate from '../../hooks/use-my-jetpack-navigate';
import { useProduct } from '../../hooks/use-product';
import GoBackLink from '../go-back-link';
import ProductDetailCard from '../product-detail-card';
import ProductDetailTable from '../product-detail-table';
import boostImage from './boost.png';
import crmImage from './crm.png';
import extrasImage from './extras.png';
import jetpackAiImage from './jetpack-ai.png';
import searchImage from './search.png';
import styles from './style.module.scss';
import videoPressImage from './videopress.png';

/**
 * Product Interstitial component.
 *
 * @param {object} props                         - Component props.
 * @param {string} props.slug                    - Product slug
 * @param {string} props.bundle                  - Bundle including this product
 * @param {object} props.children                - Product additional content
 * @param {string} props.existingLicenseKeyUrl 	 - URL to enter an existing license key (e.g. Akismet)
 * @param {boolean} props.installsPlugin         - Whether the interstitial button installs a plugin*
 * @param {React.ReactNode} props.supportingInfo - Complementary links or support/legal text
 * @param {boolean} props.preferProductName      - Use product name instead of title
 * @param {string} props.imageContainerClassName - Append a class to the image container
 * @returns {object}                               ProductInterstitial react component.
 */
export default function ProductInterstitial( {
	bundle,
	existingLicenseKeyUrl = 'admin.php?page=my-jetpack#/add-license',
	installsPlugin = false,
	slug,
	supportingInfo,
	preferProductName = false,
	children = null,
	imageContainerClassName = '',
} ) {
	const { activate, detail } = useProduct( slug );
	const { isUpgradableByBundle, tiers } = detail;

	const { recordEvent } = useAnalytics();

	useEffect( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_view', { product: slug } );
	}, [ recordEvent, slug ] );

	const trackProductClick = useCallback(
		( customSlug = null ) => {
			recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', {
				product: customSlug ?? slug,
			} );
		},
		[ recordEvent, slug ]
	);

	const trackBundleClick = useCallback( () => {
		recordEvent( 'jetpack_myjetpack_product_interstitial_add_link_click', { product: bundle } );
	}, [ recordEvent, bundle ] );

	const navigateToMyJetpackOverviewPage = useMyJetpackNavigate( '/' );

	const clickHandler = useCallback(
		( checkout, product, tier ) => {
			const activateOrCheckout = () => ( product?.isBundle ? Promise.resolve() : activate() );

			activateOrCheckout().finally( () => {
				if ( product?.isBundle ) {
					// Get straight to the checkout page.
					checkout?.();
					return;
				}

				const postActivationUrl = product?.postActivationUrl;
				const hasRequiredPlan = tier
					? product?.hasRequiredTier?.[ tier ]
					: product?.hasRequiredPlan;
				const isFree = tier
					? product?.pricingForUi?.tiers?.[ tier ]?.isFree
					: product?.pricingForUi?.isFree;
				const needsPurchase = ! isFree && ! hasRequiredPlan;

				// If no purchase is needed, redirect the user to the product screen.
				if ( ! needsPurchase ) {
					if ( postActivationUrl ) {
						window.location.href = postActivationUrl;
						return;
					}

					// Fall back to the My Jetpack overview page.
					return navigateToMyJetpackOverviewPage();
				}

				// Redirect to the checkout page.
				checkout?.();
			} );
		},
		[ navigateToMyJetpackOverviewPage, activate ]
	);

	const onClickGoBack = useCallback(
		event => {
			if ( slug ) {
				recordEvent( 'jetpack_myjetpack_product_interstitial_back_link_click', { product: slug } );
			}

			if ( document.referrer.includes( window.location.host ) ) {
				// Prevent default here to minimize page change within the My Jetpack app.
				event.preventDefault();
				history.back();
			}
		},
		[ recordEvent, slug ]
	);

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col className={ styles[ 'product-interstitial__header' ] }>
					<GoBackLink onClick={ onClickGoBack } />
					{ existingLicenseKeyUrl && (
						<Text variant="body-small">
							{ createInterpolateElement(
								__(
									'Already have an existing plan or license key? <a>Get started</a>.',
									'jetpack-my-jetpack'
								),
								{
									a: (
										<Button
											className={ styles[ 'product-interstitial__license-activation-link' ] }
											href={ existingLicenseKeyUrl }
											variant="link"
										/>
									),
								}
							) }
						</Text>
					) }
				</Col>
				<Col>
					{ tiers && tiers.length ? (
						<ProductDetailTable
							slug={ slug }
							clickHandler={ clickHandler }
							onProductButtonClick={ clickHandler }
							trackProductButtonClick={ trackProductClick }
						/>
					) : (
						<Container
							className={ ! isUpgradableByBundle ? styles.container : null }
							horizontalSpacing={ 0 }
							horizontalGap={ 0 }
							fluid
						>
							<Col sm={ 4 } md={ 4 } lg={ 7 }>
								<ProductDetailCard
									slug={ slug }
									trackButtonClick={ trackProductClick }
									onClick={ installsPlugin ? clickHandler : undefined }
									className={ isUpgradableByBundle ? styles.container : null }
									supportingInfo={ supportingInfo }
									preferProductName={ preferProductName }
								/>
							</Col>
							<Col
								sm={ 4 }
								md={ 4 }
								lg={ 5 }
								className={ classNames( styles.imageContainer, imageContainerClassName ) }
							>
								{ bundle ? (
									<ProductDetailCard
										slug={ bundle }
										trackButtonClick={ trackBundleClick }
										onClick={ clickHandler }
										className={ isUpgradableByBundle ? styles.container : null }
									/>
								) : (
									children
								) }
							</Col>
						</Container>
					) }
				</Col>
			</Container>
		</AdminPage>
	);
}

/**
 * AntiSpamInterstitial component
 *
 * @returns {object} AntiSpamInterstitial react component.
 */
export function AntiSpamInterstitial() {
	const slug = 'anti-spam';
	const { detail } = useProduct( slug );
	const { isPluginActive } = detail;

	return (
		<ProductInterstitial
			slug={ slug }
			installsPlugin={ true }
			bundle="security"
			existingLicenseKeyUrl={ isPluginActive ? 'admin.php?page=akismet-key-config' : null }
			preferProductName={ true }
		/>
	);
}

/**
 * BackupInterstitial component
 *
 * @returns {object} BackupInterstitial react component.
 */
export function BackupInterstitial() {
	return <ProductInterstitial slug="backup" installsPlugin={ true } bundle="security" />;
}

/**
 * BoostInterstitial component
 *
 * @returns {object} BoostInterstitial react component.
 */
export function BoostInterstitial() {
	return (
		<ProductInterstitial slug="boost" installsPlugin={ true }>
			<img src={ boostImage } alt="Boost" />
		</ProductInterstitial>
	);
}

/**
 * CRMInterstitial component
 *
 * @returns {object} CRMInterstitial react component.
 */
export function CRMInterstitial() {
	return (
		<ProductInterstitial slug="crm" installsPlugin={ true }>
			<img src={ crmImage } alt="CRM" />
		</ProductInterstitial>
	);
}

/**
 * ExtrasInterstitial component
 *
 * @returns {object} ExtrasInterstitial react component.
 */
export function ExtrasInterstitial() {
	return (
		<ProductInterstitial slug="extras" installsPlugin={ true }>
			<img src={ extrasImage } alt="Extras" />
		</ProductInterstitial>
	);
}

/**
 * JetpackAIInterstitial component
 *
 * @returns {object} JetpackAIInterstitial react component.
 */
export function JetpackAIInterstitial() {
	return (
		<ProductInterstitial
			slug="jetpack-ai"
			installsPlugin={ true }
			imageContainerClassName={ styles.aiImageContainer }
		>
			<img src={ jetpackAiImage } alt="Jetpack AI" />
		</ProductInterstitial>
	);
}

/**
 * ProtectInterstitial component
 *
 * @returns {object} ProtectInterstitial react component.
 */
export function ProtectInterstitial() {
	return <ProductInterstitial slug="protect" installsPlugin={ true } />;
}

/**
 * ScanInterstitial component
 *
 * @returns {object} ScanInterstitial react component.
 */
export function ScanInterstitial() {
	return <ProductInterstitial slug="scan" installsPlugin={ true } bundle="security" />;
}

/**
 * SocialInterstitial component
 *
 * @returns {object} SocialInterstitial react component.
 */
export function SocialInterstitial() {
	return <ProductInterstitial slug="social" installsPlugin={ true } />;
}

/**
 * SearchInterstitial component
 *
 * @returns {object} SearchInterstitial react component.
 */
export function SearchInterstitial() {
	const { detail } = useProduct( 'search' );
	return (
		<ProductInterstitial
			slug="search"
			installsPlugin={ true }
			supportingInfo={
				( detail?.pricingForUi?.trialAvailable
					? __(
							'Jetpack Search Free supports up to 5,000 records and 500 search requests per month for free. You will be asked to upgrade to a paid plan if you exceed these limits for three continuous months.',
							'jetpack-my-jetpack'
					  )
					: '' ) +
				__(
					"For the paid plan, pricing will automatically adjust based on the number of records in your search index. If you grow into a new pricing tier, we'll let you know before your next billing cycle.",
					'jetpack-my-jetpack'
				)
			}
		>
			<img src={ searchImage } alt="Search" />
		</ProductInterstitial>
	);
}

/**
 * VideoPressInterstitial component
 *
 * @returns {object} VideoPressInterstitial react component.
 */
export function VideoPressInterstitial() {
	return (
		<ProductInterstitial slug="videopress" installsPlugin={ true }>
			<img src={ videoPressImage } alt="VideoPress" />
		</ProductInterstitial>
	);
}
