/**
 * External dependencies
 */
import React, { Component, Fragment } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import classNames from 'classnames';
import { get } from 'lodash';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import ExternalLink from 'components/external-link';
import ProductCard from 'components/product-card';
import ProductExpiration from 'components/product-expiration';
import SingleProductBackup from './single-product-backup';
import SingleProductSearch from './single-product-search';
import { getPlanClass } from '../lib/plans/constants';
import {
	getActiveSitePurchases,
	getAvailablePlans,
	getSitePlan,
	isFetchingSiteData,
} from '../state/site';
import { getSiteRawUrl, getUpgradeUrl, isMultisite } from '../state/initial-state';
import { getProducts, isFetchingProducts } from '../state/products';
import './single-products.scss';

class ProductSelector extends Component {
	state = {
		selectedBackupType: 'real-time',
	};

	getProductCardPropsForPurchase( purchase ) {
		const { siteRawlUrl } = this.props;

		const planClass = getPlanClass( purchase.product_slug );

		// TODO: Move out those somewhere else to make this a flexible and fully reusable component.
		const dailyBackupTitle = __( 'Jetpack Backup {{em}}Daily{{/em}}', {
			components: {
				em: <em />,
			},
		} );

		const realTimeBackupTitle = __( 'Jetpack Backup {{em}}Real-Time{{/em}}', {
			components: {
				em: <em />,
			},
		} );

		const subtitle = (
			<ProductExpiration
				expiryDate={ purchase.expiry_date }
				purchaseDate={ purchase.subscribed_date }
				isRefundable={ purchase.is_refundable }
			/>
		);

		const backupDescription = __( 'Always-on backups ensure you never lose your site.' );
		const backupDescriptionRealtime = __(
			'Always-on backups ensure you never lose your site. Your changes are saved as you edit and you have unlimited backup archives.'
		);
		const planLink = (
			<a
				href={ `https://wordpress.com/plans/my-plan/${ siteRawlUrl }` }
				target="_blank"
				rel="noopener noreferrer"
			/>
		);
		const additionalProps = {
			purchase,
			isCurrent: true,
		};

		switch ( planClass ) {
			case 'is-daily-backup-plan':
				return {
					title: dailyBackupTitle,
					subtitle,
					description: backupDescription,
					...additionalProps,
				};
			case 'is-realtime-backup-plan':
				return {
					title: realTimeBackupTitle,
					subtitle,
					description: backupDescriptionRealtime,
					...additionalProps,
				};
			case 'is-personal-plan':
				return {
					title: dailyBackupTitle,
					subtitle: __( 'Included in your {{planLink}}Personal Plan{{/planLink}}', {
						components: {
							planLink,
						},
					} ),
					description: backupDescription,
					...additionalProps,
				};
			case 'is-premium-plan':
				return {
					title: dailyBackupTitle,
					subtitle: __( 'Included in your {{planLink}}Premium Plan{{/planLink}}', {
						components: {
							planLink,
						},
					} ),
					description: backupDescription,
					...additionalProps,
				};
			case 'is-business-plan':
				return {
					title: realTimeBackupTitle,
					subtitle: __( 'Included in your {{planLink}}Professional Plan{{/planLink}}', {
						components: {
							planLink,
						},
					} ),
					description: backupDescriptionRealtime,
					...additionalProps,
				};
		}
	}

	findPrioritizedPurchaseForBackup() {
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
					{ __( "Just looking for backups? We've got you covered." ) }
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

	renderSingleProductContent() {
		return (
			<div
				className={ classNames( 'plans-section__single-product', {
					'plans-section__single-product--with-search': this.props.isInstantSearchEnabled,
				} ) }
			>
				{ this.renderBackupProduct() }
				{ this.props.isInstantSearchEnabled && this.renderSearchProduct() }
			</div>
		);
	}

	renderBackupProduct() {
		// Jetpack Backup does not support Multisite yet.
		if ( this.props.multisite ) {
			return null;
		}

		const purchase = this.findPrioritizedPurchaseForBackup();
		if ( purchase ) {
			const productCardProps = this.getProductCardPropsForPurchase( purchase );
			return <ProductCard { ...productCardProps } />;
		}

		// Don't show the product card for paid plans.
		const planSlug = get( this.props.sitePlan, 'product_slug' );
		if ( ! this.props.isFetchingData && 'jetpack_free' !== planSlug ) {
			return null;
		}

		return (
			<SingleProductBackup
				isFetching={ this.props.isFetchingData }
				products={ this.props.products }
				upgradeLinkDaily={ this.props.dailyBackupUpgradeUrl }
				upgradeLinkRealtime={ this.props.realtimeBackupUpgradeUrl }
				selectedBackupType={ this.state.selectedBackupType }
				setSelectedBackupType={ this.setSelectedBackupType }
			/>
		);
	}

	renderSearchProduct() {
		return (
			<SingleProductSearch
				isFetching={ this.props.isFetchingData }
				products={ this.props.products }
				searchUpgradeUrl={ this.props.searchUpgradeUrl }
			/>
		);
	}

	render() {
		return (
			<Fragment>
				{ this.renderTitleSection() }
				{ this.renderSingleProductContent() }
			</Fragment>
		);
	}
}

export default connect( state => {
	return {
		activeSitePurchases: getActiveSitePurchases( state ),
		dailyBackupUpgradeUrl: getUpgradeUrl( state, 'jetpack-backup-daily' ),
		multisite: isMultisite( state ),
		products: getProducts( state ),
		realtimeBackupUpgradeUrl: getUpgradeUrl( state, 'jetpack-backup-realtime' ),
		searchUpgradeUrl: getUpgradeUrl( state, 'jetpack-search' ),
		sitePlan: getSitePlan( state ),
		siteRawlUrl: getSiteRawUrl( state ),
		isFetchingData:
			isFetchingSiteData( state ) || isFetchingProducts( state ) || ! getAvailablePlans( state ),
		backupInfoUrl: getUpgradeUrl( state, 'aag-backups' ), // Redirect to https://jetpack.com/upgrade/backup/
		isInstantSearchEnabled: !! get( state, 'jetpack.initialState.isInstantSearchEnabled', false ),
	};
} )( ProductSelector );
