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

const renderProduct = ( product, offers, priority, hasRelatedPlan ) => {
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

	const offer = offers?.find( ( { product_slug } ) => product_slug === product.slug );
	const price = offer?.original_price || product.fullPrice;
	const discountedPrice = offer?.raw_price;

	return (
		<JetpackProductCard
			icon={ icon }
			title={ product.title }
			productSlug={ product.slug }
			description={ product.description }
			features={ product.features }
			currencyCode={ product.currencyCode }
			price={ price / 12 }
			discountedPrice={ discountedPrice ? discountedPrice / 12 : null }
			billingDescription={ __( 'per month, paid yearly', 'jetpack' ) }
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
	const { availableProductsAndPlans, product, offers } = props;

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
				{ renderProduct( product, offers, 'primary', !! relatedPlan ) }
				{ !! relatedPlan && renderProduct( relatedPlan, offers, 'secondary', !! relatedPlan ) }
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

	// From connect HoC.
	availableProductsAndPlans: PropTypes.object.isRequired,
	offers: PropTypes.arrayOf( PropTypes.object ).isRequired,
};

export default connect( state => {
	return {
		availableProductsAndPlans: getProductsForPurchase( state ),
		offers: getIntroOffers( state ),
	};
} )( ProductDescription );
