/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import { find, isEmpty } from 'lodash';
import { __ } from '@wordpress/i18n';

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
					tagLine: jetpackCreateInterpolateElement(
						__(
							'Worried about security? Get backups, automated security fixes and more: <a>Upgrade now</a>',
							'jetpack'
						),
						{
							a: (
								<UpgradeLink
									source="my-plan-header-free-plan-text-link"
									target="upgrade-now"
									feature="my-plan-header-free-upgrade"
								/>
							),
						}
					),
					title: __( 'Jetpack Free', 'jetpack' ),
				};

			case 'is-personal-plan':
				return {
					details: expiration,
					icon: imagePath + '/plans/plan-personal.svg',
					tagLine: displayBackups
						? __( 'Daily backups, spam filtering, and priority support.', 'jetpack' )
						: __( 'Spam filtering and priority support.', 'jetpack' ),
					title: __( 'Jetpack Personal', 'jetpack' ),
				};

			case 'is-premium-plan':
				return {
					details: expiration,
					icon: imagePath + '/plans/plan-premium.svg',
					tagLine: __(
						'Full security suite, marketing and revenue automation tools, unlimited video hosting, and priority support.',
						'jetpack'
					),
					title: __( 'Jetpack Premium', 'jetpack' ),
				};

			case 'is-business-plan':
				return {
					details: expiration,
					icon: imagePath + '/plans/plan-business.svg',
					tagLine: __(
						'Full security suite, marketing and revenue automation tools, unlimited video hosting, unlimited themes, and priority support.',
						'jetpack'
					),
					title: __( 'Jetpack Professional', 'jetpack' ),
				};

			case 'is-daily-backup-plan':
				return {
					details: expiration,
					icon: imagePath + '/products/product-jetpack-backup.svg',
					tagLine: __(
						'Your data is being securely backed up every day with a 30-day archive.',
						'jetpack'
					),
					title: jetpackCreateInterpolateElement(
						__( 'Jetpack Backup <em>Daily</em>', 'jetpack' ),
						{
							em: <em />,
						}
					),
				};

			case 'is-realtime-backup-plan':
				return {
					details: expiration,
					icon: imagePath + '/products/product-jetpack-backup.svg',
					tagLine: __( 'Your data is being securely backed up as you edit.', 'jetpack' ),
					title: jetpackCreateInterpolateElement(
						__( 'Jetpack Backup <em>Real-Time</em>', 'jetpack' ),
						{
							em: <em />,
						}
					),
				};

			case 'is-search-plan':
				return {
					details: expiration,
					icon: imagePath + '/products/product-jetpack-search.svg',
					tagLine: __( 'Fast, highly relevant search results and powerful filtering.', 'jetpack' ),
					title: __( 'Jetpack Search', 'jetpack' ),
				};

			case 'is-scan-plan':
				return {
					details: expiration,
					icon: `${ imagePath }/products/product-jetpack-scan.svg`,
					tagLine: __(
						'Automatic scanning and one-click fixes keep your site one step ahead of security threats.',
						'jetpack'
					),
					title: jetpackCreateInterpolateElement( __( 'Jetpack Scan <em>Daily</em>', 'jetpack' ), {
						em: <em />,
					} ),
				};

			case 'is-anti-spam-plan':
				return {
					details: expiration,
					icon: `${ imagePath }/products/product-jetpack-anti-spam.svg`,
					tagLine: __(
						'Automatically clear spam from comments and forms. Save time, get more responses, give your visitors a better experience – all without lifting a finger.',
						'jetpack'
					),
					title: __( 'Jetpack Anti-Spam', 'jetpack' ),
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
				{ this.renderHeader( __( 'My Plan', 'jetpack' ) ) }
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
				{ this.renderHeader( __( 'My Products', 'jetpack' ) ) }
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
