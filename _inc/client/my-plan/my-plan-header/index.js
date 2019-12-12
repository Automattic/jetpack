/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import { connect } from 'react-redux';
import { find, filter, isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import ChecklistCta from './checklist-cta';
import ChecklistProgress from './checklist-progress-card';
import MyPlanCard from '../my-plan-card';
import UpgradeLink from 'components/upgrade-link';
import ProductExpiration from 'components/product-expiration';
import { getPlanClass, isJetpackBackup } from 'lib/plans/constants';
import { getUpgradeUrl, getSiteRawUrl, showBackups } from 'state/initial-state';
import { getSitePurchases } from 'state/site';
import { imagePath } from 'constants/urls';
import PropTypes from 'prop-types';

class MyPlanHeader extends React.Component {
	getProductProps( productSlug ) {
		const { displayBackups, purchases } = this.props;

		if ( ! productSlug ) {
			return {
				isPlaceholder: true,
			};
		}

		const purchase = find( purchases, purchaseObj => purchaseObj.product_slug === productSlug );
		let expiration;
		if ( purchase ) {
			expiration = (
				<ProductExpiration
					expiryDate={ purchase.expiry_date }
					purchaseDate={ purchase.subscribed_date }
					isRefundable={ purchase.is_refundable }
				/>
			);
		}

		switch ( getPlanClass( productSlug ) ) {
			case 'is-free-plan':
				return {
					icon: imagePath + '/plans/plan-free.svg',
					tagLine: __(
						'Worried about security? Get backups, automated security fixes and more: {{a}}Upgrade now{{/a}}',
						{
							components: {
								a: (
									<UpgradeLink
										source="my-plan-header-free-plan-text-link"
										target="upgrade-now"
										feature="my-plan-header-free-upgrade"
									/>
								),
							},
						}
					),
					title: __( 'Jetpack Free' ),
				};

			case 'is-personal-plan':
				return {
					details: expiration,
					icon: imagePath + '/plans/plan-personal.svg',
					tagLine: displayBackups
						? __( 'Daily backups, spam filtering, and priority support.' )
						: __( 'Spam filtering and priority support.' ),
					title: __( 'Jetpack Personal' ),
				};

			case 'is-premium-plan':
				return {
					details: expiration,
					icon: imagePath + '/plans/plan-premium.svg',
					tagLine: __(
						'Full security suite, marketing and revenue automation tools, unlimited video hosting, and priority support.'
					),
					title: __( 'Jetpack Premium' ),
				};

			case 'is-business-plan':
				return {
					details: expiration,
					icon: imagePath + '/plans/plan-business.svg',
					tagLine: __(
						'Full security suite, marketing and revenue automation tools, unlimited video hosting, unlimited themes, enhanced search, and priority support.'
					),
					title: __( 'Jetpack Professional' ),
				};

			case 'is-daily-backup-plan':
				return {
					details: expiration,
					icon: imagePath + '/products/product-jetpack-backup.svg',
					tagLine: __( 'Your data is being securely backed up every day with a 30-day archive.' ),
					title: __( 'Jetpack Backup {{em}}Daily{{/em}}', {
						components: {
							em: <em />,
						},
					} ),
				};

			case 'is-realtime-backup-plan':
				return {
					details: expiration,
					icon: imagePath + '/products/product-jetpack-backup.svg',
					tagLine: __( 'Your data is being securely backed up as you edit.' ),
					title: __( 'Jetpack Backup {{em}}Real-Time{{/em}}', {
						components: {
							em: <em />,
						},
					} ),
				};

			default:
				return {
					isPlaceholder: true,
				};
		}
	}

	renderPlan() {
		const { plan } = this.props;
		const planProps = this.getProductProps( plan );

		return (
			<Card compact>
				{ this.renderHeader( __( 'My Plan' ) ) }
				<MyPlanCard { ...planProps } />
			</Card>
		);
	}

	renderProducts() {
		const { purchases } = this.props;
		const products = filter( purchases, purchase => isJetpackBackup( purchase.product_slug ) );

		if ( isEmpty( products ) ) {
			return null;
		}

		return (
			<Card compact>
				{ this.renderHeader( __( 'My Products' ) ) }
				{ products.map( ( { ID, product_slug } ) => {
					const productProps = this.getProductProps( product_slug );

					return <MyPlanCard key={ 'product-card-' + ID } { ...productProps } />;
				} ) }
			</Card>
		);
	}

	renderHeader( title ) {
		return <h3 className="jp-landing__card-header">{ title }</h3>;
	}

	render() {
		const { plan, siteSlug } = this.props;

		return (
			<div className="jp-landing__plans">
				{ this.renderPlan() }
				{ this.renderProducts() }
				<Card compact>
					<ChecklistCta onClick={ this.trackChecklistCtaClick } siteSlug={ siteSlug } />
				</Card>
				<ChecklistProgress plan={ plan } />
			</div>
		);
	}
}

MyPlanHeader.propTypes = {
	plan: PropTypes.string,
	siteRawUrl: PropTypes.string,

	// From connect HoC
	siteSlug: PropTypes.string,
	displayBackups: PropTypes.bool,
	plansMainTopUpgradeUrl: PropTypes.string,
	purchases: PropTypes.array,
};

export default connect( state => {
	return {
		siteSlug: getSiteRawUrl( state ),
		displayBackups: showBackups( state ),
		plansMainTopUpgradeUrl: getUpgradeUrl( state, 'plans-main-top' ),
		purchases: getSitePurchases( state ),
	};
} )( MyPlanHeader );
