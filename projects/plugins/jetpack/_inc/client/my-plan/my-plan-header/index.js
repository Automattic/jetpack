import { getRedirectUrl } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { isInTheFuture } from '@wordpress/date';
import { createInterpolateElement } from '@wordpress/element';
import { __, _n, _x, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import Button from 'components/button';
import Card from 'components/card';
import { ProductActivated } from 'components/product-activated';
import ProductExpiration from 'components/product-expiration';
import UpgradeLink from 'components/upgrade-link';
import analytics from 'lib/analytics';
import {
	containsGiftedPlanOrProduct,
	getPlanClass,
	PLAN_JETPACK_FREE,
	JETPACK_BACKUP_PRODUCTS,
	JETPACK_SCAN_PRODUCTS,
} from 'lib/plans/constants';
import { find, isEmpty } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import {
	getUpgradeUrl,
	getDateFormat,
	showBackups,
	showRecommendations,
	showLicensingUi,
} from 'state/initial-state';
import { getDetachedLicensesCount } from 'state/licensing';
import MyPlanCard from '../my-plan-card';
import License from './license';

const TIER_0_BACKUP_STORAGE_GB = 1;
const TIER_1_BACKUP_STORAGE_GB = 10;
const TIER_2_BACKUP_STORAGE_TB = 1;

class MyPlanHeader extends React.Component {
	getProductProps( productSlug, activeProducts = [] ) {
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
		let activation;
		if ( purchase ) {
			expiration = (
				<ProductExpiration
					// Add key because this goes to `details` as array.
					key="product-expiration"
					dateFormat={ dateFormat }
					expiryDate={ purchase.expiry_date }
					purchaseDate={ purchase.subscribed_date }
					isRefundable={ purchase.is_refundable }
					isGift={ containsGiftedPlanOrProduct( purchase.product_slug ) }
					purchaseID={ purchase.ID }
				/>
			);
			if ( purchase.active === '1' ) {
				// Purchases might not have an expiration date, so we need to check
				// for their existence (e.g.: lifetime plan like Golden Token).
				if ( ! isInTheFuture( purchase.expiry_date ) && purchase.expiry_date !== null ) {
					activation = <ProductActivated key="product-expired" type="product-expired" />;
				} else {
					activation = (
						<ProductActivated
							key="product-activated"
							type={ purchase.expiry_date === null ? 'never-expires' : '' }
						/>
					);
				}
			} else {
				activation = null;
			}
		}

		switch ( getPlanClass( productSlug ) ) {
			case 'is-free-plan': {
				// Default tagline
				let tagLineText = __(
					'Worried about security? Get backups, automated security fixes and more: <a>Upgrade now</a>',
					'jetpack'
				);

				if ( activeProducts.length ) {
					const hasSiteJetpackBackup = activeProducts.some( ( { product_slug } ) =>
						JETPACK_BACKUP_PRODUCTS.includes( product_slug )
					);

					const hasSiteJetpackScan = activeProducts.some( ( { product_slug } ) =>
						JETPACK_SCAN_PRODUCTS.includes( product_slug )
					);

					if ( hasSiteJetpackBackup && hasSiteJetpackScan ) {
						tagLineText = __(
							'Upgrade your site to access additional features, including spam protection and priority support: <a>Upgrade now</a>',
							'jetpack'
						);
					} else if ( hasSiteJetpackBackup ) {
						tagLineText = __(
							'Upgrade your site to access additional features, including spam protection, security scanning, and priority support: <a>Upgrade now</a>',
							'jetpack'
						);
					} else if ( hasSiteJetpackScan ) {
						tagLineText = __(
							'Upgrade your site to access additional features, including spam protection, backups, and priority support: <a>Upgrade now</a>',
							'jetpack'
						);
					}
				}

				return {
					...productProps,
					tagLine: createInterpolateElement( tagLineText, {
						a: (
							<UpgradeLink
								source="my-plan-header-free-plan-text-link"
								target="upgrade-now"
								feature="my-plan-header-free-upgrade"
							/>
						),
					} ),
					title: __( 'Jetpack Free', 'jetpack' ),
				};
			}

			case 'is-personal-plan':
				return {
					...productProps,
					details: expiration,
					tagLine: displayBackups
						? __( 'Daily backups, spam filtering, and priority support.', 'jetpack' )
						: __(
								'Spam filtering and priority support.',
								'jetpack',
								/* dummy arg to avoid bad minification */ 0
						  ),
					title: __( 'Jetpack Personal', 'jetpack' ),
				};

			case 'is-premium-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'Full security suite, marketing and revenue automation tools, unlimited video hosting, and priority support.',
						'jetpack'
					),
					title: __( 'Jetpack Premium', 'jetpack' ),
				};

			case 'is-business-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'Full security suite, marketing and revenue automation tools, unlimited video hosting, and priority support.',
						'jetpack'
					),
					title: __( 'Jetpack Professional', 'jetpack' ),
				};

			case 'is-security-t1-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: createInterpolateElement(
						sprintf(
							/* translators: %1$d is the number of gigabytes of storage space the site has. */
							_n(
								'Enjoy the peace of mind of complete site protection. You have <strong>%1$dGB</strong> of storage space.',
								'Enjoy the peace of mind of complete site protection. You have <strong>%1$dGB</strong> of storage space.',
								TIER_1_BACKUP_STORAGE_GB,
								'jetpack'
							),
							TIER_1_BACKUP_STORAGE_GB
						),
						{ strong: <strong /> }
					),
					title: __( 'Jetpack Security', 'jetpack' ),
				};

			case 'is-security-t2-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: createInterpolateElement(
						sprintf(
							/* translators: %1$d is the number of gigabytes of storage space the site has. */
							_n(
								'Enjoy the peace of mind of complete site protection. You have <strong>%1$dTB</strong> of storage space.',
								'Enjoy the peace of mind of complete site protection. You have <strong>%1$dTB</strong> of storage space.',
								TIER_2_BACKUP_STORAGE_TB,
								'jetpack'
							),
							TIER_2_BACKUP_STORAGE_TB
						),
						{ strong: <strong /> }
					),
					title: __( 'Jetpack Security', 'jetpack' ),
				};

			case 'is-complete-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'The ultimate toolkit for best-in-class websites: complete security, performance, and growth.',
						'jetpack'
					),
					title: __( 'Jetpack Complete', 'jetpack' ),
				};

			case 'is-backup-t0-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: createInterpolateElement(
						sprintf(
							/* translators: %1$d is the number of gigabytes of storage space the site has. */
							_n(
								'Your data is being securely backed up as you edit. You have <strong>%1$dGB</strong> of storage space.',
								'Your data is being securely backed up as you edit. You have <strong>%1$dGB</strong> of storage space.',
								TIER_0_BACKUP_STORAGE_GB,
								'jetpack'
							),
							TIER_0_BACKUP_STORAGE_GB
						),
						{ strong: <strong /> }
					),
					title: __( 'VaultPress Backup', 'jetpack' ),
				};

			case 'is-backup-t1-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: createInterpolateElement(
						sprintf(
							/* translators: %1$d is the number of gigabytes of storage space the site has. */
							_n(
								'Your data is being securely backed up as you edit. You have <strong>%1$dGB</strong> of storage space.',
								'Your data is being securely backed up as you edit. You have <strong>%1$dGB</strong> of storage space.',
								TIER_1_BACKUP_STORAGE_GB,
								'jetpack'
							),
							TIER_1_BACKUP_STORAGE_GB
						),
						{ strong: <strong /> }
					),
					title: __( 'VaultPress Backup', 'jetpack' ),
				};

			case 'is-backup-t2-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: createInterpolateElement(
						sprintf(
							/* translators: %1$d is the number of terabytes of storage space the site has. */
							_n(
								'Your data is being securely backed up as you edit. You have <strong>%1$dTB</strong> of storage space.',
								'Your data is being securely backed up as you edit. You have <strong>%1$dTB</strong> of storage space.',
								TIER_2_BACKUP_STORAGE_TB,
								'jetpack'
							),
							TIER_2_BACKUP_STORAGE_TB
						),
						{ strong: <strong /> }
					),
					title: __( 'VaultPress Backup', 'jetpack' ),
				};

			case 'is-search-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __( 'Fast, highly relevant search results and powerful filtering.', 'jetpack' ),
					title: __( 'Jetpack Search', 'jetpack' ),
				};

			case 'is-free-search-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __( 'Fast, highly relevant search results and powerful filtering.', 'jetpack' ),
					title: __( 'Jetpack Search Free', 'jetpack' ),
				};

			case 'is-scan-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'Automatic scanning and one-click fixes keep your site one step ahead of security threats.',
						'jetpack'
					),
					title: createInterpolateElement( __( 'Jetpack Scan', 'jetpack' ), {
						em: <em />,
					} ),
				};

			case 'is-anti-spam-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'Automatically clear spam from comments and forms. Save time, get more responses, give your visitors a better experience – all without lifting a finger.',
						'jetpack'
					),
					title: __( 'Akismet Anti-spam', 'jetpack' ),
				};

			// DEPRECATED: Daily and Real-time variations will soon be retired.
			// Remove after all customers are migrated to new products.
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

			case 'is-videopress-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __( 'High-quality, ad-free video built specifically for WordPress.', 'jetpack' ),
					title: __( 'Jetpack VideoPress', 'jetpack' ),
				};

			case 'is-jetpack-social-basic-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'You can automatically share your content to social media sites.',
						'jetpack'
					),
					title: createInterpolateElement( __( 'Jetpack Social Basic', 'jetpack' ), {
						em: <em />,
					} ),
				};

			case 'is-jetpack-social-v1-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'You can automatically share your content to social media sites.',
						'jetpack'
					),
					title: createInterpolateElement( __( 'Jetpack Social', 'jetpack' ), {
						em: <em />,
					} ),
				};

			case 'is-jetpack-social-advanced-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'You can automatically share your content to social media sites and get access to advanced posting options.',
						'jetpack'
					),
					title: createInterpolateElement( __( 'Jetpack Social Advanced', 'jetpack' ), {
						em: <em />,
					} ),
				};

			case 'is-jetpack-boost-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'Jetpack Boost gives your site the same performance advantages as the world’s leading websites, no developer required.',
						'jetpack'
					),
					title: __( 'Jetpack Boost', 'jetpack' ),
				};

			case 'is-jetpack-ai-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'Experience the ease of crafting content with intuitive and powerful AI.',
						'jetpack'
					),
					title: __( 'Jetpack AI', 'jetpack' ),
				};

			case 'is-jetpack-golden-token-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'You have been gifted a Jetpack Golden Token. This unlocks a lifetime of Jetpack VaultPress Backup and Jetpack Scan for your website.',
						'jetpack'
					),
					title: __( 'Jetpack Golden Token', 'jetpack' ),
					cardClassNames: [ 'plan-golden-token' ],
				};

			case 'is-jetpack-starter-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'Essential security tools: real-time backups and comment spam protection.',
						'jetpack'
					),
					title: __( 'Jetpack Starter', 'jetpack' ),
				};

			case 'is-jetpack-stats-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __( 'Simple, yet powerful analytics with priority support.', 'jetpack' ),
					title: __( 'Jetpack Stats', 'jetpack' ),
				};

			case 'is-free-jetpack-stats-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __( 'Simple, yet powerful analytics.', 'jetpack' ),
					title: __( 'Jetpack Stats Free', 'jetpack' ),
				};
			case 'is-jetpack-creator-plan':
				return {
					...productProps,
					details: [ activation, expiration ],
					tagLine: __(
						'Craft stunning content, boost your subscriber base, and monetize your online presence.',
						'jetpack'
					),
					title: __( 'Jetpack Creator', 'jetpack' ),
				};

			default:
				return {
					...productProps,
					isPlaceholder: true,
				};
		}
	}

	renderPlan() {
		// Hide "My Plan" card if there are active products and no paid plan.
		if ( ! isEmpty( this.props.activeProducts ) && this.props.plan === PLAN_JETPACK_FREE ) {
			return null;
		}

		return (
			<Card compact>
				{ this.renderHeader( __( 'My Plan', 'jetpack' ) ) }
				<MyPlanCard
					{ ...this.getProductProps( this.props.plan, this.props.activeProducts ) }
					isPlan
				/>
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

	/**
	 * Renders license related actions
	 *
	 * @param {'header'|'footer'} position - Whether the actions are for header or footer
	 * @returns {React.ReactElement} The licence actions
	 */
	renderLicensingActions = ( position = 'header' ) => {
		const {
			hasDetachedUserLicenses,
			showRecommendations: showRecommendationsButton,
			siteAdminUrl,
			purchases,
		} = this.props;
		// 'showRecommendationsButton' will be false if Jetpack is not active or we are in offline mode or if this is an Atomic site.
		if ( ! showRecommendationsButton ) {
			return null;
		}

		const showPurchasesLink = !! purchases?.length && 'header' === position;

		return (
			<Card compact>
				<div className="jp-landing__licensing-actions">
					{ 'header' === position && (
						<span>
							{ createInterpolateElement(
								/* translators: %s is the link to the License management page. */
								__( 'Got a license key? <a>Activate it here.</a>', 'jetpack' ),
								{
									a: (
										<a
											href={
												! window.Initial_State?.useMyJetpackLicensingUI
													? siteAdminUrl + 'admin.php?page=jetpack#/license/activation'
													: siteAdminUrl + 'admin.php?page=my-jetpack#/add-license'
											}
											onClick={ this.trackLicenseActivationClick }
											className="jp-landing__licensing-actions-link"
										/>
									),
								}
							) }
						</span>
					) }
					<div
						className={ clsx( 'jp-landing__licensing-actions-item', {
							'no-licenses': ! hasDetachedUserLicenses,
							'no-purchases': ! showPurchasesLink,
						} ) }
					>
						{ showPurchasesLink && (
							<Button onClick={ this.trackAllPurchasesClick } compact rna>
								<ExternalLink href={ getRedirectUrl( 'calypso-purchases' ) }>
									{ __( 'View all purchases', 'jetpack' ) }
								</ExternalLink>
							</Button>
						) }

						{ 'footer' === position && (
							<Button
								href={ siteAdminUrl + 'admin.php?page=jetpack#/recommendations' }
								onClick={ this.trackRecommendationsClick }
								primary
								rna
							>
								{ _x( 'Recommendations', 'Navigation item.', 'jetpack' ) }
							</Button>
						) }
					</div>
				</div>
			</Card>
		);
	};

	trackAllPurchasesClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'calypso_purchases_link',
			page: 'my-plan',
		} );
	};
	trackLicenseActivationClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'licensing_activation_button',
			path: 'licensing/activation',
			page: 'my-plan',
		} );
	};
	trackRecommendationsClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'recommendations-button',
			page: 'my-plan',
		} );
	};

	renderFooter() {
		return (
			// The activation label should be displayed in the footer only if
			// there is no product to be activated.
			! this.props.hasDetachedUserLicenses && this.renderLicensingActions( 'footer' )
		);
	}

	render() {
		return (
			<div className="jp-landing__plans">
				{ this.renderLicensingActions() }
				{ this.renderPlan() }
				{ this.renderProducts() }
				{ this.renderFooter() }
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
		hasDetachedUserLicenses: !! getDetachedLicensesCount( state ),
	};
} )( MyPlanHeader );
