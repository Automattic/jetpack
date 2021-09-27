/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import PropTypes from 'prop-types';
import classNames from 'classnames';
import { isEmpty } from 'lodash';
import { __, sprintf } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import JetpackProductCard from 'components/jetpack-product-card';
import { MoneyBackGuarantee } from 'components/money-back-guarantee';
import { getProductsForPurchase } from 'state/initial-state';
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
	const upsellPlan = 'jetpack-security-daily';

	if (
		isEmpty( product.includedInPlans ) ||
		! availableProductsAndPlans.hasOwnProperty( upsellPlan ) ||
		! product.includedInPlans.includes( upsellPlan )
	) {
		return false;
	}

	return availableProductsAndPlans[ upsellPlan ];
};

const renderProduct = ( product, priority, hasRelatedPlan, arePromotionsActive ) => {
	const discount =
		arePromotionsActive && product.showPromotion ? product.promotionPercentage : undefined;
	const illustration =
		! hasRelatedPlan && productIllustrations.hasOwnProperty( product.key )
			? productIllustrations[ product.key ]
			: undefined;
	let cta, icon;

	switch ( product.slug ) {
		case 'jetpack_backup_daily':
			icon = cloudIcon;
			break;
		case 'jetpack_scan':
			icon = shieldIcon;
			break;
		case 'jetpack_anti_spam':
			icon = bugIcon;
			break;
		case 'jetpack_security_daily':
			icon = bundleIcon;
			cta = __( 'Popular upgrade', 'jetpack' );
			break;
	}

	return (
		<JetpackProductCard
			icon={ icon }
			title={ product.title }
			description={ product.description }
			features={ product.features }
			currencyCode={ product.currencyCode }
			price={ product.fullPrice / 12 }
			discount={ discount }
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
	const { arePromotionsActive, availableProductsAndPlans, product } = props;

	const relatedPlan = getRelatedProductPlan( product, availableProductsAndPlans );

	const classes = classNames( {
		'jp-product-description': true,
		'jp-product-description--split': !! relatedPlan,
	} );

	return (
		<>
			<div className={ classes }>
				{ renderProduct( product, 'primary', !! relatedPlan, arePromotionsActive ) }
				{ !! relatedPlan &&
					renderProduct( relatedPlan, 'secondary', !! relatedPlan, arePromotionsActive ) }
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

	// From connect HoC.
	availableProductsAndPlans: PropTypes.object.isRequired,
};

ProductDescription.defaultProps = {
	arePromotionsActive: false,
};

export default connect( state => {
	return {
		availableProductsAndPlans: getProductsForPurchase( state ),
	};
} )( ProductDescription );
