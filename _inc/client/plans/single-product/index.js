/**
 * External dependencies
 */
import React from 'react';
import { withRouter } from 'react-router';

/**
 * Internal dependencies
 */
import Button from 'components/button';
import Card from 'components/card';
import ExternalLink from 'components/external-link';
import Gridicon from 'components/gridicon';
import PlanRadioButton from 'plans/single-product-components/plan-radio-button';
import ProductSavings from 'plans/single-product-components/product-savings';
import ProductOptionsLabel from 'plans/single-product-components/product-options-label';
import UpgradeButton from 'plans/single-product-components/upgrade-button';
import PromoNudge from 'plans/single-product-components/promo-nudge';
import analytics from 'lib/analytics';
import getRedirectUrl from 'lib/jp-redirect';
import { getPlanClass } from 'lib/plans/constants';
import { DAILY_BACKUP_TITLE, REALTIME_BACKUP_TITLE } from 'plans/constants';
import { translate as __ } from 'i18n-calypso';
import ProductExpiration from 'components/product-expiration';

import './style.scss';

function handleLandingPageLinkClick( key, duration ) {
	const extra = 'monthly' === duration ? `${ key }-monthly` : key;

	return () => {
		analytics.tracks.recordJetpackClick( {
			target: 'landing-page-link',
			feature: `single-product-${ key }`,
			extra,
		} );
	};
}

function handleUpgradeLinkClick( selectedUpgrade, route ) {
	return () => {
		analytics.tracks.recordJetpackClick( {
			target: `upgrade-${ selectedUpgrade.type }`,
			type: 'upgrade',
			product: selectedUpgrade.type,
			// NOTE: This depends on React-Router's withRouter HOC
			page: name,
		} );
	};
}

function renderPossiblePurchase( product, props ) {
	const { planDuration, selectedUpgrade, routes } = props;
	const name = routes[ 0 ] && routes[ 0 ].name;

	function handleSelectedTypeChange( key, type ) {
		return () => {
			props.setSelectedProduct( key, type );
		};
	}

	return (
		<>
			{ product.showPromotion && <PromoNudge percent={ product.promotionPercentage } /> }
			<ProductOptionsLabel product={ product } />
			<div className="single-product__radio-buttons-container">
				{ product.options.map( option => {
					return (
						<PlanRadioButton
							product={ product }
							key={ option.type }
							billingTimeFrame={ planDuration }
							checked={ option.type === selectedUpgrade.type }
							currencyCode={ option.currencyCode }
							fullPrice={ option[ planDuration ].fullPrice }
							discountedPrice={ option.discountedPrice }
							onChange={ handleSelectedTypeChange( product.key, option.type ) }
							radioValue={ option.type }
							planName={ option.name }
						/>
					);
				} ) }
			</div>
			<ProductSavings
				billingTimeframe={ planDuration }
				currencyCode={ selectedUpgrade.currencyCode }
				potentialSavings={ selectedUpgrade.potentialSavings }
			/>
			<UpgradeButton
				onClickHandler={ handleUpgradeLinkClick( selectedUpgrade, name ) }
				selectedUpgrade={ selectedUpgrade }
			/>
		</>
	);
}

function renderPurchase( product, purchase ) {
	const purchaseUrl = getRedirectUrl( 'calypso-me-purchases', {
		site: purchase.blog_id,
		path: purchase.ID,
	} );
	return (
		<div className="single-product__purchase">
			<Button href={ purchaseUrl }>{ __( 'Manage Subscription' ) }</Button>
			<div className="single-product__purchase-description">{ product.description }</div>
		</div>
	);
}

function getProduct( product, purchase, siteRawlUrl ) {
	if ( ! purchase ) {
		return product;
	}

	const planClass = getPlanClass( purchase.product_slug );
	const planLink = (
		<a
			href={ getRedirectUrl( 'calypso-plans-my-plan', { site: siteRawlUrl } ) }
			target="_blank"
			rel="noopener noreferrer"
		/>
	);

	const description = (
		<ProductExpiration
			expiryDate={ purchase.expiry_date }
			purchaseDate={ purchase.subscribed_date }
			isRefundable={ purchase.is_refundable }
		/>
	);

	switch ( planClass ) {
		case 'is-daily-backup-plan':
			product.title = DAILY_BACKUP_TITLE;
			product.description = description;
			break;

		case 'is-realtime-backup-plan':
			product.title = REALTIME_BACKUP_TITLE;
			product.description = description;
			break;

		case 'is-personal-plan':
			product.title = product.key === 'backup' ? DAILY_BACKUP_TITLE : product.title;
			product.description = __( 'Included in your {{planLink}}Personal Plan{{/planLink}}', {
				components: { planLink },
			} );
			break;

		case 'is-premium-plan':
			product.title = product.key === 'backup' ? DAILY_BACKUP_TITLE : product.title;
			product.description = __( 'Included in your {{planLink}}Premium Plan{{/planLink}}', {
				components: { planLink },
			} );
			break;

		case 'is-business-plan':
			product.title = product.key === 'backup' ? REALTIME_BACKUP_TITLE : product.title;
			product.description = __( 'Included in your {{planLink}}Professional Plan{{/planLink}}', {
				components: { planLink },
			} );
			break;
		default:
			product.description = description;
			break;
	}

	return product;
}

function SingleProductCard( props ) {
	const { planDuration, isFetching, purchase, siteRawlUrl } = props;
	const isPurchased = !! purchase;

	const product = getProduct( props.product, purchase, siteRawlUrl );
	return isFetching ? (
		<Card className="single-product__accented-card is-placeholder" />
	) : (
		<Card className="single-product__accented-card">
			<div className="single-product__accented-card-header">
				{ isPurchased && <Gridicon icon="checkmark" size={ 18 } /> }
				<h3 className="single-product__header-title">{ product.title }</h3>
			</div>
			<div className="single-product__accented-card-body">
				<div className="single-product__description">{ product.shortDescription }</div>

				<div className="single-product__landing-page">
					<ExternalLink
						target="_blank"
						href={ product.learnMoreUrl }
						icon
						iconSize={ 12 }
						onClick={ handleLandingPageLinkClick( product.key, planDuration ) }
					>
						{ product.learnMore }
					</ExternalLink>
				</div>
				{ isPurchased
					? renderPurchase( product, purchase )
					: renderPossiblePurchase( product, props ) }
			</div>
		</Card>
	);
}

export default withRouter( SingleProductCard );
