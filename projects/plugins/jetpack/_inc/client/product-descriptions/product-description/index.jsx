/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isEmpty } from 'lodash';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import JetpackProductCard from 'components/jetpack-product-card';
import { MoneyBackGuarantee } from 'components/money-back-guarantee';
import { getProductsForPurchase } from 'state/initial-state';
import { getIntroOffers } from 'state/intro-offers';
import { getSaleCoupon } from 'state/sale-coupon';
import { productIllustrations } from '../constants';
import {
	cloud as cloudIcon,
	shield as shieldIcon,
	removeBug as bugIcon,
	combined as bundleIcon,
} from './icons';

/**
 * Import styles
 */
import './style.scss';

const getRelatedProductPlan = ( product, availableProductsAndPlans ) => {
	const upsellPlan = 'security';

	if (
		isEmpty( product.includedInPlans ) ||
		! availableProductsAndPlans.hasOwnProperty( upsellPlan ) ||
		! product.includedInPlans.includes( upsellPlan )
	) {
		return false;
	}

	return availableProductsAndPlans[ upsellPlan ];
};

const renderProduct = (
	product,
	priority,
	hasRelatedPlan,
	arePromotionsActive,
	introOffers,
	saleCoupon
) => {
	const introOffer = introOffers.find( offer => offer.product_slug === product.slug );
	const discountRatio = saleCoupon && saleCoupon.discount ? saleCoupon.discount / 100 : 0;
	const introOfferPrice = introOffer ? introOffer.raw_price / 12 : null;
	const discountedPrice =
		arePromotionsActive &&
		product.showPromotion &&
		( introOfferPrice || product.fullPrice / 12 ) * ( 1 - discountRatio );

	const illustration =
		! hasRelatedPlan && productIllustrations.hasOwnProperty( product.key )
			? productIllustrations[ product.key ]
			: undefined;
	let cta, icon;

	switch ( product.slug ) {
		case 'jetpack_backup_t1_yearly':
			icon = cloudIcon;
			break;
		case 'jetpack_scan':
			icon = shieldIcon;
			break;
		case 'jetpack_anti_spam':
			icon = bugIcon;
			break;
		case 'jetpack_security_t1_yearly':
			icon = bundleIcon;

			if ( 'secondary' === priority ) {
				cta = __( 'Popular upgrade', 'jetpack' );
			}
			break;
	}

	return (
		<JetpackProductCard
			icon={ icon }
			title={ product.title }
			productSlug={ product.slug }
			description={ product.description }
			features={ product.features }
			currencyCode={ product.currencyCode }
			price={ product.fullPrice / 12 }
			discountedPrice={ discountedPrice }
			billingDescription={ __( '/month, paid yearly', 'jetpack' ) }
			callToAction={ cta }
			priority={ priority }
			illustrationPath={ illustration }
			checkoutUrl={ product.upgradeUrl }
			checkoutText={ sprintf(
				/* translators: %s: Name of a Jetpack product. */
				__( 'Add %s', 'jetpack' ),
				product.title
			) }
		/>
	);
};

const ProductDescription = props => {
	const {
		arePromotionsActive,
		availableProductsAndPlans,
		product,
		introOffers,
		saleCoupon,
	} = props;

	const relatedPlan = getRelatedProductPlan( product, availableProductsAndPlans );

	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_product_description_view', {
			type: product.slug,
		} );
	}, [ product ] );

	const classes = classNames( {
		'jp-product-description': true,
		'jp-product-description--split': !! relatedPlan,
	} );

	return (
		<>
			<div className={ classes }>
				{ renderProduct(
					product,
					'primary',
					!! relatedPlan,
					arePromotionsActive,
					introOffers,
					saleCoupon
				) }
				{ !! relatedPlan &&
					renderProduct(
						relatedPlan,
						'secondary',
						!! relatedPlan,
						arePromotionsActive,
						introOffers,
						saleCoupon
					) }
			</div>

			<div className="jp-product-description__introductory-pricing">
				{ __( 'Special introductory pricing, all renewals are at full price.', 'jetpack' ) }
			</div>
			<div className="jp-product-description__money-back-guarantee">
				<MoneyBackGuarantee text={ __( '14-day money-back guarantee', 'jetpack' ) } />
			</div>
		</>
	);
};

ProductDescription.propTypes = {
	product: PropTypes.object.isRequired,
	arePromotionsActive: PropTypes.bool,
	introOffers: PropTypes.arrayOf( PropTypes.object ),

	// From connect HoC.
	availableProductsAndPlans: PropTypes.object.isRequired,
};

ProductDescription.defaultProps = {
	arePromotionsActive: false,
};

export default connect( state => {
	return {
		availableProductsAndPlans: getProductsForPurchase( state ),
		introOffers: getIntroOffers( state ),
		saleCoupon: getSaleCoupon( state ),
	};
} )( ProductDescription );
