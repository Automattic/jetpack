/**
 * External dependencies
 */
import React from 'react';
import PropTypes from 'prop-types';
import { connect } from 'react-redux';
import { find, isEmpty } from 'lodash';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import Card from 'components/card';
import ProductExpiration from 'components/product-expiration';
import UpgradeLink from 'components/upgrade-link';
import { getPlanClass } from 'lib/plans/constants';
import {
	getUpgradeUrl,
	getDateFormat,
	showBackups,
	showRecommendations,
	showLicensingUi,
} from 'state/initial-state';
import License from './license';
import MyPlanCard from '../my-plan-card';

class MyPlanHeader extends React.Component {
	getProductProps( productSlug ) {
		const { displayBackups, dateFormat, purchases } = this.props;

		const productProps = {
			productSlug,
		};

		if ( ! productSlug ) {
			return {
				...productProps,
				isPlaceholder: true,
			};
		}

		const purchase = find( purchases, purchaseObj => purchaseObj.product_slug === productSlug );
		let expiration;
		if ( purchase ) {
			expiration = (
				<ProductExpiration
					dateFormat={ dateFormat }
					expiryDate={ purchase.expiry_date }
					purchaseDate={ purchase.subscribed_date }
					isRefundable={ purchase.is_refundable }
				/>
			);
		}

		switch ( getPlanClass( productSlug ) ) {
			case 'is-free-plan':
				return {
					...productProps,
					tagLine: createInterpolateElement(
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
					...productProps,
					details: expiration,
					tagLine: displayBackups
						? __( 'Daily backups, spam filtering, and priority support.', 'jetpack' )
						: __( 'Spam filtering and priority support.', 'jetpack' ),
					title: __( 'Jetpack Personal', 'jetpack' ),
				};

			case 'is-premium-plan':
				return {
					...productProps,
					details: expiration,
					tagLine: __(
						'Full security suite, marketing and revenue automation tools, unlimited video hosting, and priority support.',
						'jetpack'
					),
					title: __( 'Jetpack Premium', 'jetpack' ),
				};

			case 'is-business-plan':
				return {
					...productProps,
					details: expiration,
					tagLine: __(
						'Full security suite, marketing and revenue automation tools, unlimited video hosting, and priority support.',
						'jetpack'
					),
					title: __( 'Jetpack Professional', 'jetpack' ),
				};

			case 'is-daily-security-plan':
				return {
					...productProps,
					details: expiration,
					tagLine: __(
						'Enjoy the peace of mind of complete site protection. Great for brochure sites, restaurants, blogs, and resume sites.',
						'jetpack'
					),
					title: __( 'Jetpack Security Daily', 'jetpack' ),
				};

			case 'is-realtime-security-plan':
				return {
					...productProps,
					details: expiration,
					tagLine: __(
						'Additional security for sites with 24/7 activity. Recommended for eCommerce stores, news organizations, and online forums.',
						'jetpack'
					),
					title: __( 'Jetpack Security Real-Time', 'jetpack' ),
				};

			case 'is-complete-plan':
				return {
					...productProps,
					details: expiration,
					tagLine: __(
						'The most powerful WordPress sites: Top-tier security bundle, enhanced search.',
						'jetpack'
					),
					title: __( 'Jetpack Complete', 'jetpack' ),
				};

			case 'is-daily-backup-plan':
				return {
					...productProps,
					details: expiration,
					tagLine: __(
						'Your data is being securely backed up every day with a 30-day archive.',
						'jetpack'
					),
					title: createInterpolateElement( __( 'Jetpack Backup <em>Daily</em>', 'jetpack' ), {
						em: <em />,
					} ),
				};

			case 'is-realtime-backup-plan':
				return {
					...productProps,
					details: expiration,
					tagLine: __( 'Your data is being securely backed up as you edit.', 'jetpack' ),
					title: createInterpolateElement( __( 'Jetpack Backup <em>Real-Time</em>', 'jetpack' ), {
						em: <em />,
					} ),
				};

			case 'is-search-plan':
				return {
					...productProps,
					details: expiration,
					tagLine: __( 'Fast, highly relevant search results and powerful filtering.', 'jetpack' ),
					title: __( 'Jetpack Search', 'jetpack' ),
				};

			case 'is-scan-plan':
				return {
					...productProps,
					details: expiration,
					tagLine: __(
						'Automatic scanning and one-click fixes keep your site one step ahead of security threats.',
						'jetpack'
					),
					title: createInterpolateElement( __( 'Jetpack Scan <em>Daily</em>', 'jetpack' ), {
						em: <em />,
					} ),
				};

			case 'is-anti-spam-plan':
				return {
					...productProps,
					details: expiration,
					tagLine: __(
						'Automatically clear spam from comments and forms. Save time, get more responses, give your visitors a better experience – all without lifting a finger.',
						'jetpack'
					),
					title: __( 'Jetpack Anti-Spam', 'jetpack' ),
				};

			default:
				return {
					...productProps,
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

	trackRecommendationsClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'recommendations-button',
			page: 'my-plan',
		} );
	};

	render() {
		return (
			<div className="jp-landing__plans">
				{ this.renderPlan() }
				{ this.renderProducts() }
				{ this.props.showRecommendations && (
					<Card compact>
						<div className="jp-landing__plan-features-header-recommendations-cta-container">
							<Button
								href={ this.props.siteAdminUrl + 'admin.php?page=jetpack#/recommendations' }
								onClick={ this.trackRecommendationsClick }
								primary
							>
								{ _x( 'Recommendations', 'Navigation item.', 'jetpack' ) }
							</Button>
						</div>
					</Card>
				) }
				{ this.props.showLicensingUi && (
					<Card compact>
						<License />
					</Card>
				) }
			</div>
		);
	}
}

MyPlanHeader.propTypes = {
	activeProducts: PropTypes.array,
	plan: PropTypes.string,
	purchases: PropTypes.array,
	siteAdminUrl: PropTypes.string,

	// From connect HoC
	dateFormat: PropTypes.string,
	displayBackups: PropTypes.bool,
	plansMainTopUpgradeUrl: PropTypes.string,
	showRecommendations: PropTypes.bool,
};

export default connect( state => {
	return {
		dateFormat: getDateFormat( state ),
		displayBackups: showBackups( state ),
		plansMainTopUpgradeUrl: getUpgradeUrl( state, 'plans-main-top' ),
		showRecommendations: showRecommendations( state ),
		showLicensingUi: showLicensingUi( state ),
	};
} )( MyPlanHeader );
