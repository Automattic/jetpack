/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { translate as __ } from 'i18n-calypso';
import { connect } from 'react-redux';
import { find, isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';
import Card from 'components/card';
import ProductExpiration from 'components/product-expiration';
import UpgradeLink from 'components/upgrade-link';
import { getPlanClass } from 'lib/plans/constants';
import { getUpgradeUrl, getSiteRawUrl, showBackups } from 'state/initial-state';
import ChecklistCta from './checklist-cta';
import ChecklistProgress from './checklist-progress-card';
import MyPlanCard from '../my-plan-card';

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
						'Full security suite, marketing and revenue automation tools, unlimited video hosting, unlimited themes, and priority support.'
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

			case 'is-search-plan':
				return {
					details: expiration,
					icon: imagePath + '/products/product-jetpack-search.svg',
					tagLine: __( 'Fast, highly relevant search results and powerful filtering.' ),
					title: __( 'Jetpack Search' ),
				};

			case 'is-scan-plan':
				return {
					details: expiration,
					icon: `${ imagePath }/products/product-jetpack-scan.svg`,
					tagLine: __(
						'Automatic scanning and one-click fixes keep your site one step ahead of security threats.'
					),
					title: __( 'Jetpack Scan {{em}}Daily{{/em}}', { components: { em: <em /> } } ),
				};

			case 'is-anti-spam-plan':
				return {
					details: expiration,
					icon: `${ imagePath }/products/product-jetpack-anti-spam.svg`,
					tagLine: __(
						'Automatically clear spam from comments and forms. Save time, get more responses, give your visitors a better experience – all without lifting a finger.'
					),
					title: __( 'Jetpack Anti-Spam' ),
				};

			default:
				return {
					isPlaceholder: true,
				};
		}
	}

	renderPlan() {
		return (
			<Card compact>
				{ this.renderHeader( __( 'My Plan' ) ) }
				<MyPlanCard { ...this.getProductProps( this.props.plan ) } />
			</Card>
		);
	}

	renderProducts() {
		if ( isEmpty( this.props.activeProducts ) ) {
			return null;
		}

		return (
			<Card compact>
				{ this.renderHeader( __( 'My Products' ) ) }
				{ this.props.activeProducts.map( ( { ID, product_slug } ) => (
					<MyPlanCard key={ 'product-card-' + ID } { ...this.getProductProps( product_slug ) } />
				) ) }
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
	};
} )( MyPlanHeader );
