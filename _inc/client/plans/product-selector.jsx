/**
 * External dependencies
 */
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import QuerySiteProducts from 'components/data/query-site-products';
import { getPlanClass } from 'lib/plans/constants';
import { getProductsForPurchase, getSiteRawUrl, isMultisite } from 'state/initial-state';
import {
	getActiveSitePurchases,
	getAvailablePlans,
	getSitePlan,
	getActiveSearchPurchase,
	isFetchingSiteData,
} from 'state/site';
import { isFetchingSiteProducts, getSiteProducts } from 'state/site-products';
import { getPlanDuration } from 'state/plans/reducer';
import SingleProductCard from './single-product';
import './single-products.scss';
import DurationSwitcher from './duration-switcher';

class ProductSelector extends Component {
	state = {
		selectedProduct: {},
	};

	setSelectedProduct = ( key, type ) => {
		const selectedProduct = this.state.selectedProduct;
		selectedProduct[ key ] = type;
		this.setState( { selectedProduct } );
	};

	renderTitleSection() {
		return (
			<Fragment>
				<h1 className="plans-section__header">{ __( 'Solutions' ) }</h1>
				<h2 className="plans-section__subheader">
					{ __( "Looking for specific features? We've got you covered." ) }
				</h2>
			</Fragment>
		);
	}

	getProduct( key ) {
		return this.props.productsForPurchase.find( product => product.key === key );
	}

	getSelectedType( key ) {
		const product = this.getProduct( key );
		return this.state.selectedProduct && this.state.selectedProduct[ key ]
			? this.state.selectedProduct[ key ]
			: product.defaultOption;
	}

	getProductOption( key, optionType ) {
		const product = this.getProduct( key );
		return product.options.find( option => option.type === optionType );
	}

	getOptionName( key, option ) {
		return option.name;
	}

	getOptionPurchaseLink( key, option ) {
		return option[ this.props.planDuration ] ? option[ this.props.planDuration ].upgradeUrl : null;
	}

	getSelectedUpgrade( key ) {
		const type = this.getSelectedType( key );
		const option = this.getProductOption( key, type );
		const name = this.getOptionName( key, option );
		const link = this.getOptionPurchaseLink( key, option );
		const currencyCode = option.currencyCode;
		const potentialSavings = option.monthly.fullPrice * 12 - option.yearly.fullPrice;
		return {
			link,
			name,
			type,
			currencyCode,
			potentialSavings,
		};
	}

	getPurchase( product ) {
		return this.props.activeSitePurchases.find( item => {
			const planClass = getPlanClass( item.product_slug ).substring( 3 ); // removes the is-
			if ( product.includedInPlans.includes( planClass ) ) {
				return item;
			}
		} );
	}

	renderProductsForPurchase() {
		const { isFetchingData, productsForPurchase, planDuration, siteRawlUrl } = this.props;

		return (
			<>
				{ productsForPurchase.map( function( product ) {
					return (
						<SingleProductCard
							product={ product }
							key={ product.key }
							isFetching={ isFetchingData }
							selectedUpgrade={ this.getSelectedUpgrade( product.key ) }
							planDuration={ planDuration }
							setSelectedProduct={ this.setSelectedProduct }
							purchase={ this.getPurchase( product ) }
							siteRawlUrl={ siteRawlUrl }
						/>
					);
				}, this ) }
			</>
		);
	}

	render() {
		return (
			<div className="plans-feature-main-group">
				<QuerySiteProducts />
				{ this.renderTitleSection() }
				<DurationSwitcher type="solutions" />
				<div className="product-selector">{ this.renderProductsForPurchase() }</div>
			</div>
		);
	}
}

export default connect( state => {
	return {
		activeSitePurchases: getActiveSitePurchases( state ),
		productsForPurchase: getProductsForPurchase( state ),
		isFetchingData:
			isFetchingSiteData( state ) ||
			! getAvailablePlans( state ) ||
			isFetchingSiteProducts( state ),
		planDuration: getPlanDuration( state ),
		multisite: isMultisite( state ),
		searchPurchase: getActiveSearchPurchase( state ),
		sitePlan: getSitePlan( state ),
		siteProducts: getSiteProducts( state ),
		siteRawlUrl: getSiteRawUrl( state ),
	};
} )( ProductSelector );
