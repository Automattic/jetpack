/**
 * External dependencies
 */
import React from 'react';
import Card from 'components/card';

/**
 * Internal dependencies
 */
import ExternalLink from 'components/external-link';
import PlanRadioButton from 'plans/single-product-components/plan-radio-button';
import ProductSavings from 'plans/single-product-components/product-savings';
import UpgradeButton from 'plans/single-product-components/upgrade-button';
import PromoNudge from 'plans/single-product-components/promo-nudge';
import analytics from 'lib/analytics';

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

function handleUpgradeLinkClick( selectedUpgrade ) {
	return () => {
		analytics.tracks.recordJetpackClick( {
			target: `upgrade-${ selectedUpgrade.type }`,
			type: 'upgrade',
			product: selectedUpgrade.type,
			// NOTE: This depends on React-Router's withRouter HOC
			page: this.props.routes[ 0 ] && this.props.routes[ 0 ].name,
		} );
	};
}

export default function SingleProductCard( props ) {
	const { planDuration, product, isFetching, selectedUpgrade } = props;

	function handleSelectedTypeChange( key, type ) {
		return () => {
			props.setSelectedProduct( key, type );
		};
	}

	return isFetching ? (
		<div className="plans-section__single-product-skeleton is-placeholder" />
	) : (
		<Card className="single-product__accented-card">
			<div className="single-product__accented-card-header">
				<h3 className="single-product-backup__header-title">{ product.title }</h3>
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

				{ product.showPromotion && <PromoNudge /> }
				<h4 className="single-product-backup__options-header">{ product.optionsLabel }</h4>

				<div className="single-product-backup__radio-buttons-container">
					{ product.options.map( option => {
						return (
							<PlanRadioButton
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
					onClickHandler={ handleUpgradeLinkClick( selectedUpgrade ) }
					selectedUpgrade={ selectedUpgrade }
				/>
			</div>
		</Card>
	);
}
