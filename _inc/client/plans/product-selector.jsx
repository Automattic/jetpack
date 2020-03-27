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
import ExternalLink from 'components/external-link';
import analytics from 'lib/analytics';
import { getPlanClass } from 'lib/plans/constants';
import { getSiteRawUrl, getUpgradeUrl, isMultisite } from 'state/initial-state';
import {
	getActiveSitePurchases,
	getAvailablePlans,
	getSitePlan,
	getActiveSearchPurchase,
	isFetchingSiteData,
} from 'state/site';
import { isFetchingSiteProducts, getSiteProducts } from 'state/site-products';
import PurchasedProductCard from './single-product-components/purchased-product-card';
import SingleProductBackup from './single-product-backup';
import SingleProductSearch from './single-product-search';
import './single-products.scss';

class ProductSelector extends Component {
	state = {
		selectedBackupType: 'real-time',
	};

	findPrioritizedPurchaseForBackup() {
		// TODO: Consider rolling this into a selector in state/site
		// Note: the order here is important, as it resolves cases where a site
		// has both a plan and a product at the same time.
		const planClasses = [
			'is-business-plan',
			'is-realtime-backup-plan',
			'is-premium-plan',
			'is-personal-plan',
			'is-daily-backup-plan',
		];

		for ( const planClass of planClasses ) {
			const purchase = this.props.activeSitePurchases.find(
				item => getPlanClass( item.product_slug ) === planClass
			);
			if ( undefined !== purchase ) {
				return purchase;
			}
		}

		return false;
	}

	handleLandingPageLinkClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'landing-page-link',
			feature: 'single-product-backup',
			extra: this.state.selectedBackupType,
		} );
	};

	setSelectedBackupType = selectedBackupType => {
		this.setState( { selectedBackupType } );
	};

	renderTitleSection() {
		const { backupInfoUrl, isFetchingData } = this.props;
		return (
			<Fragment>
				<h1 className="plans-section__header">{ __( 'Solutions' ) }</h1>
				<h2 className="plans-section__subheader">
					{ __( "Looking for specific features? We've got you covered." ) }
					{ ! isFetchingData && ! this.findPrioritizedPurchaseForBackup() && (
						<>
							<br />
							<ExternalLink
								target="_blank"
								href={ backupInfoUrl }
								icon
								iconSize={ 12 }
								onClick={ this.handleLandingPageLinkClick }
							>
								{ __( 'Which backup option is best for me?' ) }
							</ExternalLink>
						</>
					) }
				</h2>
			</Fragment>
		);
	}

	renderBackupProduct() {
		// Jetpack Backup does not support Multisite yet.
		if ( this.props.multisite ) {
			return null;
		}

		const purchase = this.findPrioritizedPurchaseForBackup();
		if ( purchase ) {
			return <PurchasedProductCard purchase={ purchase } siteRawlUrl={ this.props.siteRawlUrl } />;
		}

		// Don't show the product card for paid plans.
		const planSlug = get( this.props.sitePlan, 'product_slug' );
		if ( ! this.props.isFetchingData && 'jetpack_free' !== planSlug ) {
			return null;
		}

		return (
			<SingleProductBackup
				isFetching={ this.props.isFetchingData }
				products={ this.props.siteProducts }
				selectedBackupType={ this.state.selectedBackupType }
				setSelectedBackupType={ this.setSelectedBackupType }
			/>
		);
	}

	renderSearchProduct() {
		return this.props.searchPurchase ? (
			<PurchasedProductCard
				purchase={ this.props.searchPurchase }
				siteRawlUrl={ this.props.siteRawlUrl }
			/>
		) : (
			<SingleProductSearch
				isFetching={ this.props.isFetchingData }
				searchPurchase={ this.props.searchPurchase }
				siteProducts={ this.props.siteProducts }
			/>
		);
	}

	render() {
		return (
			<Fragment>
				<QuerySiteProducts />
				{ this.renderTitleSection() }
				<div className="plans-section__single-product plans-section__single-product--with-search">
					{ this.renderBackupProduct() }
					{ this.renderSearchProduct() }
				</div>
			</Fragment>
		);
	}
}

export default connect( state => {
	return {
		activeSitePurchases: getActiveSitePurchases( state ),
		backupInfoUrl: getUpgradeUrl( state, 'aag-backups' ), // Redirect to https://jetpack.com/upgrade/backup/
		multisite: isMultisite( state ),
		searchPurchase: getActiveSearchPurchase( state ),
		sitePlan: getSitePlan( state ),
		siteProducts: getSiteProducts( state ),
		siteRawlUrl: getSiteRawUrl( state ),
		isFetchingData:
			isFetchingSiteData( state ) ||
			! getAvailablePlans( state ) ||
			isFetchingSiteProducts( state ),
	};
} )( ProductSelector );
