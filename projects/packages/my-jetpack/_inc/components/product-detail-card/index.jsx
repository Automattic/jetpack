// eslint-disable-next-line no-unused-vars
/* global myJetpackInitialState */

import { getCurrencyObject } from '@automattic/format-currency';
import {
	CheckmarkIcon,
	getIconBySlug,
	StarIcon,
	Text,
	H3,
	Alert,
} from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import { Icon, check, plus } from '@wordpress/icons';
import classnames from 'classnames';
import React, { useCallback } from 'react';
import useAnalytics from '../../hooks/use-analytics';
import useMyJetpackConnection from '../../hooks/use-my-jetpack-connection';
import { useProduct } from '../../hooks/use-product';
import getProductCheckoutUrl from '../../utils/get-product-checkout-url';
import ProductDetailButton from '../product-detail-button';
import styles from './style.module.scss';

/**
 * React component to render the price.
 *
 * @param {object} props          - Component props.
 * @param {string} props.value    - Product price
 * @param {string} props.currency - Product current code
 * @param {string} props.isOld    - True when the product price is old
 * @returns {object}                Price react component.
 */
function Price( { value, currency, isOld } ) {
	if ( ! value || ! currency ) {
		return null;
	}

	const priceObject = getCurrencyObject( value, currency );

	const classNames = classnames( styles.price, {
		[ styles[ 'is-old' ] ]: isOld,
	} );

	return (
		<Text className={ classNames } variant="headline-medium" component="p">
			<Text component="sup" variant="title-medium">
				{ priceObject.symbol }
			</Text>
			{ priceObject.integer }
			<Text component="sup" variant="title-medium">
				{ priceObject.fraction }
			</Text>
		</Text>
	);
}

/**
 * Product Detail component.
 *
 * @param {object} props                         - Component props.
 * @param {string} props.slug                    - Product slug
 * @param {Function} props.onClick               - Callback for Call To Action button click
 * @param {Function} props.trackButtonClick      - Function to call for tracking clicks on Call To Action button
 * @param {string} props.className               - A className to be concat with default ones
 * @param {React.ReactNode} props.supportingInfo - Complementary links or support/legal text
 * @returns {object}                               ProductDetailCard react component.
 */
const ProductDetailCard = ( { slug, onClick, trackButtonClick, className, supportingInfo } ) => {
	const fileSystemWriteAccess = window?.myJetpackInitialState?.fileSystemWriteAccess;
	const { detail, isFetching } = useProduct( slug );
	const {
		title,
		longDescription,
		features,
		disclaimers,
		pricingForUi,
		isBundle,
		supportedProducts,
		hasRequiredPlan,
		status,
		pluginSlug,
	} = detail;

	const cantInstallPlugin = status === 'plugin_absent' && 'no' === fileSystemWriteAccess;

	const {
		isFree,
		fullPricePerMonth: price,
		currencyCode,
		discountPricePerMonth: discountPrice,
		wpcomProductSlug,
	} = pricingForUi;
	const { isUserConnected } = useMyJetpackConnection();

	const { recordEvent } = useAnalytics();

	/*
	 * Product needs purchase when:
	 * - it's not free
	 * - it does not have a required plan
	 */
	const needsPurchase = ! isFree && ! hasRequiredPlan;

	const addProductUrl =
		needsPurchase && wpcomProductSlug
			? getProductCheckoutUrl( wpcomProductSlug, isUserConnected ) // @ToDo: Remove this when we have a new product structure.
			: null;

	// Suppported products icons.
	const icons = isBundle
		? supportedProducts
				.join( '_plus_' )
				.split( '_' )
				.map( ( iconSlug, i ) => {
					if ( iconSlug === 'plus' ) {
						return (
							<Icon
								className={ styles[ 'plus-icon' ] }
								key={ `icon-plugs${ i }` }
								icon={ plus }
								size={ 14 }
							/>
						);
					}

					const SupportedProductIcon = getIconBySlug( iconSlug );
					return <SupportedProductIcon key={ iconSlug } size={ 24 } />;
				} )
		: null;

	const clickHandler = useCallback( () => {
		trackButtonClick();
		if ( onClick ) {
			onClick();
		}
	}, [ onClick, trackButtonClick ] );

	const disclaimerClickHandler = useCallback(
		id => {
			recordEvent( 'jetpack_myjetpack_product_card_disclaimer_click', {
				id: id,
				product: slug,
			} );
		},
		[ slug, recordEvent ]
	);

	/**
	 * Temporary ProductIcon component.
	 * Todo: Fix in product-icons component.
	 * https://github.com/Automattic/jetpack/issues/23640
	 *
	 * @param {object} props      - Component props.
	 * @param {string} props.slug - Product icon slug
	 * @returns {object}            Icon Product component.
	 */
	function ProductIcon( { slug: iconSlug } ) {
		const ProIcon = getIconBySlug( iconSlug );
		if ( ! ProIcon ) {
			return () => null;
		}

		return (
			<div className={ styles[ 'product-icon' ] }>
				<ProIcon />
			</div>
		);
	}

	return (
		<div
			className={ classnames( styles.card, className, {
				[ styles[ 'is-bundle-card' ] ]: isBundle,
			} ) }
		>
			{ isBundle && (
				<div className={ styles[ 'card-header' ] }>
					<StarIcon className={ styles[ 'product-bundle-icon' ] } size={ 16 } />
					<Text variant="label">{ __( 'Popular upgrade', 'jetpack-my-jetpack' ) }</Text>
				</div>
			) }

			<div className={ styles.container }>
				{ isBundle && <div className={ styles[ 'product-bundle-icons' ] }>{ icons }</div> }
				<ProductIcon slug={ slug } />

				<H3>{ title }</H3>
				<Text mb={ 3 }>{ longDescription }</Text>

				<ul className={ styles.features }>
					{ features.map( ( feature, id ) => (
						<Text component="li" key={ `feature-${ id }` } variant="body">
							<Icon icon={ check } size={ 24 } />
							{ feature }
						</Text>
					) ) }
				</ul>

				{ needsPurchase && (
					<>
						<div className={ styles[ 'price-container' ] }>
							<Price value={ price } currency={ currencyCode } isOld={ true } />
							<Price value={ discountPrice } currency={ currencyCode } isOld={ false } />
						</div>
						<Text className={ styles[ 'price-description' ] }>
							{ __( '/month, paid yearly', 'jetpack-my-jetpack' ) }
						</Text>
					</>
				) }

				{ isFree && <H3>{ __( 'Free', 'jetpack-my-jetpack' ) }</H3> }

				{ cantInstallPlugin && (
					<Alert>
						<Text>
							{ sprintf(
								// translators: %s is the plugin name.
								__(
									"Due to your server settings, we can't automatically install the plugin for you. Please manually install the %s plugin.",
									'jetpack-my-jetpack'
								),
								title
							) }
							&nbsp;
							<ExternalLink href={ `https://wordpress.org/plugins/${ pluginSlug }` }>
								{ __( 'Get plugin', 'jetpack-my-jetpack' ) }
							</ExternalLink>
						</Text>
					</Alert>
				) }

				{ ( ! isBundle || ( isBundle && ! hasRequiredPlan ) ) && (
					<Text
						component={ ProductDetailButton }
						onClick={ clickHandler }
						isLoading={ isFetching }
						disabled={ cantInstallPlugin }
						isPrimary={ ! isBundle }
						href={ onClick ? undefined : addProductUrl }
						className={ styles[ 'checkout-button' ] }
						variant="body"
					>
						{
							/* translators: placeholder is product name. */
							sprintf( __( 'Add %s', 'jetpack-my-jetpack' ), title )
						}
					</Text>
				) }

				{ disclaimers.length > 0 && (
					<div className={ styles.disclaimers }>
						{ disclaimers.map( ( disclaimer, id ) => {
							const { text, link_text = null, url = null } = disclaimer;

							return (
								<Text key={ `disclaimer-${ id }` } component="p" variant="body-small">
									{ `${ text } ` }
									{ url && link_text && (
										<ExternalLink
											// Ignoring rule so I can pass ID to analytics in order to tell which disclaimer was clicked if there is more than one
											/* eslint-disable react/jsx-no-bind */
											onClick={ () => disclaimerClickHandler( id ) }
											href={ url }
											target="_blank"
											rel="noopener noreferrer"
										>
											{ link_text }
										</ExternalLink>
									) }
								</Text>
							);
						} ) }
					</div>
				) }

				{ isBundle && hasRequiredPlan && (
					<div className={ styles[ 'product-has-required-plan' ] }>
						<CheckmarkIcon size={ 36 } />
						<Text>{ __( 'Active on your site', 'jetpack-my-jetpack' ) }</Text>
					</div>
				) }

				{ supportingInfo && (
					<Text className={ styles[ 'supporting-info' ] } variant="body-extra-small">
						{ supportingInfo }
					</Text>
				) }
			</div>
		</div>
	);
};

ProductDetailCard.defaultProps = {
	trackButtonClick: () => {},
};

export default ProductDetailCard;
