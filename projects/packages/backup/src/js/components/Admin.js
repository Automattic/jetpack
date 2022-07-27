import {
	AdminPage,
	AdminSection,
	AdminSectionHero,
	Container,
	Col,
	getRedirectUrl,
	PricingCard,
} from '@automattic/jetpack-components';
import apiFetch from '@wordpress/api-fetch';
import { ExternalLink } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { createInterpolateElement, useState, useEffect, useCallback } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import useAnalytics from '../hooks/useAnalytics';
import useConnection from '../hooks/useConnection';
import { STORE_ID } from '../store';
import Backups from './Backups';
import ReviewRequest from './review-request';
import './admin-style.scss';
import './masthead/masthead-style.scss';

/* eslint react/react-in-jsx-scope: 0 */
const Admin = () => {
	const [ connectionStatus, renderConnectScreen ] = useConnection();
	const [ capabilities, setCapabilities ] = useState( [] );
	const [ capabilitiesError, setCapabilitiesError ] = useState( null );
	const [ connectionLoaded, setConnectionLoaded ] = useState( false );
	const [ capabilitiesLoaded, setCapabilitiesLoaded ] = useState( false );
	const [ showHeaderFooter, setShowHeaderFooter ] = useState( true );
	const [ price, setPrice ] = useState( 0 );
	const [ priceAfter, setPriceAfter ] = useState( 0 );
	const [ restores, setRestores ] = useState( [] );
	// To be used on next iteration of review requests
	const [ , setCurrentPurchases ] = useState( [] );
	const { tracks } = useAnalytics();

	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );

	useEffect( () => {
		tracks.recordEvent( 'jetpack_backup_admin_page_view' );
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		if ( 0 < Object.keys( connectionStatus ).length ) {
			setConnectionLoaded( true );
		}
	}, [ connectionStatus ] );

	useEffect( () => {
		apiFetch( { path: '/jetpack/v4/restores' } ).then(
			res => {
				setRestores( res );
			},
			() => {
				setRestores( 'Failed to fetch restores' );
			}
		);
		apiFetch( { path: '/jetpack/v4/site/current-purchases' } ).then(
			res => {
				setCurrentPurchases( res.data );
			},
			() => {
				setCurrentPurchases( 'Failed to fetch current purchases' );
			}
		);
		apiFetch( { path: '/jetpack/v4/backup-capabilities' } ).then(
			res => {
				setCapabilities( res.capabilities );
				setCapabilitiesLoaded( true );
			},
			() => {
				setCapabilitiesLoaded( true );
				setCapabilitiesError( 'Failed to fetch site capabilities' );
			}
		);
		apiFetch( { path: '/jetpack/v4/backup-promoted-product-info' } ).then( res => {
			setPrice( res.cost / 12 );
			if ( res.introductory_offer ) {
				setPriceAfter( res.introductory_offer.cost_per_interval / 12 );
			} else {
				setPriceAfter( res.cost / 12 );
			}
		} );
	}, [] );

	const isFullyConnected = () => {
		return connectionLoaded && connectionStatus.isUserConnected && connectionStatus.isRegistered;
	};

	const hasBackupPlan = () => {
		return capabilities.includes( 'backup' );
	};

	// Check if the site has a successful restore not older than 15 days
	const hasRecentSuccesfulRestore = () => {
		if ( restores[ 0 ] && restores[ 0 ].status === 'finished' ) {
			// Number of days we consider the restore recent
			const maxDays = 15;
			const daysDifference = ( new Date() - Date.parse( restores[ 0 ].when ) ) / 86400000;
			if ( daysDifference < maxDays ) {
				return true;
			}
		}
		return false;
	};

	const sendToCart = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_plugin_upgrade_click', { site: domain } );
		window.location.href = getRedirectUrl( 'backup-plugin-upgrade-10gb', { site: domain } );
	}, [ tracks, domain ] );

	const sendToReview = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_new_review_click' );
		window.location.href = getRedirectUrl( 'jetpack-backup-new-review' );
	}, [ tracks ] );

	const trackLearnMoreClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_learn_more_click' );
	}, [ tracks ] );

	const trackSeeAllBackupsClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_see_all_backups_click', { site: domain } );
	}, [ tracks, domain ] );

	const trackSeeSiteActivityClick = useCallback( () => {
		tracks.recordEvent( 'jetpack_backup_see_site_activity_click', { site: domain } );
	}, [ tracks, domain ] );

	const NoBackupCapabilities = () => {
		const basicInfoText = __( '14 day money back guarantee.', 'jetpack-backup-pkg' );
		const introductoryInfoText = __(
			'Special introductory pricing, all renewals are at full price. 14 day money back guarantee.',
			'jetpack-backup-pkg'
		);
		return (
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col lg={ 6 } md={ 6 } sm={ 4 }>
					<h1>{ __( 'Secure your site with a Backup subscription.', 'jetpack-backup-pkg' ) }</h1>
					<p>
						{ ' ' }
						{ __(
							'Get peace of mind knowing that all your work will be saved, and get back online quickly with one-click restores.',
							'jetpack-backup-pkg'
						) }
					</p>
					<ul className="jp-product-promote">
						<li>{ __( 'Automated real-time backups', 'jetpack-backup-pkg' ) }</li>
						<li>{ __( 'Easy one-click restores', 'jetpack-backup-pkg' ) }</li>
						<li>{ __( 'Complete list of all site changes', 'jetpack-backup-pkg' ) }</li>
						<li>{ __( 'Global server infrastructure', 'jetpack-backup-pkg' ) }</li>
						<li>{ __( 'Best-in-class support', 'jetpack-backup-pkg' ) }</li>
					</ul>
				</Col>
				<Col lg={ 1 } md={ 1 } sm={ 0 } />
				<Col lg={ 5 } md={ 6 } sm={ 4 }>
					<PricingCard
						ctaText={ __( 'Get Jetpack Backup', 'jetpack-backup-pkg' ) }
						icon="data:image/svg+xml,%3Csvg width='32' height='32' fill='none' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath fill-rule='evenodd' clip-rule='evenodd' d='m21.092 15.164.019-1.703v-.039c0-1.975-1.803-3.866-4.4-3.866-2.17 0-3.828 1.351-4.274 2.943l-.426 1.524-1.581-.065a2.92 2.92 0 0 0-.12-.002c-1.586 0-2.977 1.344-2.977 3.133 0 1.787 1.388 3.13 2.973 3.133H22.399c1.194 0 2.267-1.016 2.267-2.4 0-1.235-.865-2.19-1.897-2.368l-1.677-.29Zm-10.58-3.204a4.944 4.944 0 0 0-.201-.004c-2.75 0-4.978 2.298-4.978 5.133s2.229 5.133 4.978 5.133h12.088c2.357 0 4.267-1.97 4.267-4.4 0-2.18-1.538-3.99-3.556-4.339v-.06c0-3.24-2.865-5.867-6.4-5.867-2.983 0-5.49 1.871-6.199 4.404Z' fill='%23000'/%3E%3C/svg%3E"
						infoText={ priceAfter === price ? basicInfoText : introductoryInfoText }
						// eslint-disable-next-line react/jsx-no-bind
						onCtaClick={ sendToCart }
						priceAfter={ priceAfter }
						priceBefore={ price }
						title={ __( 'Jetpack Backup', 'jetpack-backup-pkg' ) }
					/>
				</Col>
			</Container>
		);
	};

	const ReviewMessage = () => (
		<Col lg={ 6 } md={ 4 }>
			<ReviewRequest
				description={ 'Was it easy to restore your site?' }
				cta={ createInterpolateElement(
					__(
						'<strong>Please leave a review and help us spread the word!</strong>',
						'jetpack-backup-pkg'
					),
					{
						strong: <strong></strong>,
					}
				) }
				// eslint-disable-next-line react/jsx-no-bind
				onClick={ sendToReview }
			/>
		</Col>
	);

	const LoadedState = () => {
		if (
			! connectionLoaded ||
			! connectionStatus.isUserConnected ||
			! connectionStatus.isRegistered
		) {
			if ( showHeaderFooter ) {
				setShowHeaderFooter( false );
			}

			return (
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col lg={ 12 } md={ 8 } sm={ 4 }>
						{ renderConnectScreen() }
					</Col>
				</Container>
			);
		}

		// Show header and footer on all screens except ConnectScreen
		if ( ! showHeaderFooter ) {
			setShowHeaderFooter( true );
		}

		if ( ! capabilitiesLoaded ) {
			return <div></div>;
		}

		if ( hasBackupPlan() ) {
			return (
				<Container horizontalSpacing={ 5 } fluid>
					<Col>
						<Backups />
					</Col>
				</Container>
			);
		}

		// Render an error state, this shouldn't occurr since we've passed userConnected checks
		if ( capabilitiesError ) {
			return (
				<Container horizontalSpacing={ 3 }>
					<Col lg={ 12 } md={ 8 } sm={ 4 }>
						{ capabilitiesError }
					</Col>
				</Container>
			);
		}

		return <NoBackupCapabilities />;
	};

	// Renders additional segments under the jp-hero area condition on having a backup plan
	const BackupSegments = () => {
		return (
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col lg={ 6 } md={ 4 }>
					<h2>{ __( 'Restore points created with every edit', 'jetpack-backup-pkg' ) }</h2>
					<p className="jp-realtime-note">
						{ createInterpolateElement(
							__(
								'No need to run a manual backup before you make changes to your site. <ExternalLink>Learn more</ExternalLink>',
								'jetpack-backup-pkg'
							),
							{
								ExternalLink: (
									<ExternalLink
										href={ getRedirectUrl( 'jetpack-blog-realtime-mechanics' ) }
										onClick={ trackLearnMoreClick }
									/>
								),
							}
						) }
					</p>

					<h2>{ __( 'Where are backups stored?', 'jetpack-backup-pkg' ) }</h2>
					<p>
						{ __(
							'All the backups are safely stored in the cloud and available for you at any time on Jetpack.com, with full details about status and content.',
							'jetpack-backup-pkg'
						) }
					</p>
					{ hasBackupPlan() && (
						<p>
							<ExternalLink
								href={ getRedirectUrl( 'jetpack-backup', { site: domain } ) }
								onClick={ trackSeeAllBackupsClick }
							>
								{ __( 'See all your backups', 'jetpack-backup-pkg' ) }
							</ExternalLink>
						</p>
					) }
				</Col>
				<Col lg={ 1 } md={ 1 } sm={ 0 } />
				<Col lg={ 5 } md={ 3 } sm={ 4 }>
					<h2>{ __( "Your site's heartbeat", 'jetpack-backup-pkg' ) }</h2>
					<p>
						{ __(
							'The activity log lets you see everything that’s going on with your site outlined in an organized, readable way.',
							'jetpack-backup-pkg'
						) }
					</p>
					{ hasBackupPlan() && (
						<p>
							<ExternalLink
								href={ getRedirectUrl( 'backup-plugin-activity-log', { site: domain } ) }
								onClick={ trackSeeSiteActivityClick }
							>
								{ __( "See your site's activity", 'jetpack-backup-pkg' ) }
							</ExternalLink>
						</p>
					) }
				</Col>
				{ hasRecentSuccesfulRestore() && <ReviewMessage /> }
			</Container>
		);
	};

	const Content = () => {
		return (
			<div className="content">
				<AdminSectionHero>
					<LoadedState />
				</AdminSectionHero>
				<AdminSection>{ isFullyConnected() && <BackupSegments /> }</AdminSection>
			</div>
		);
	};

	return (
		<AdminPage
			withHeader={ showHeaderFooter }
			withFooter={ showHeaderFooter }
			moduleName={ __( 'Jetpack Backup', 'jetpack-backup-pkg' ) }
			a8cLogoHref="https://www.jetpack.com"
		>
			<div id="jetpack-backup-admin-container" className="jp-content">
				<Content />
			</div>
		</AdminPage>
	);
};

export default Admin;
