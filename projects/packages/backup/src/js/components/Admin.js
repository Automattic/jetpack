/**
 * External dependencies
 */
import { useState, useEffect } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import apiFetch from '@wordpress/api-fetch';
import { useSelect } from '@wordpress/data';
import {
	AdminPage,
	AdminSection,
	AdminSectionHero,
	Container,
	Col,
	getRedirectUrl,
	PricingCard,
} from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import Backups from './Backups';
import useConnection from '../hooks/useConnection';
import './admin-style.scss';
import './masthead/masthead-style.scss';
import { STORE_ID } from '../store';

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

	const domain = useSelect( select => select( STORE_ID ).getCalypsoSlug(), [] );

	useEffect( () => {
		if ( 0 < Object.keys( connectionStatus ).length ) {
			setConnectionLoaded( true );
		}
	}, [ connectionStatus ] );

	useEffect( () => {
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

	const sendToCart = () => {
		window.location.href = getRedirectUrl( 'backup-plugin-upgrade-10gb', { site: domain } );
	};

	const renderNoBackupCapabilities = () => {
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

	const renderLoadedState = () => {
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

		return renderNoBackupCapabilities();
	};

	// Renders additional segments under the jp-hero area condition on having a backup plan
	const renderBackupSegments = () => {
		return (
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col lg={ 6 } md={ 4 }>
					<h2>{ __( 'Your cloud backups', 'jetpack-backup-pkg' ) }</h2>
					<p>
						{ __(
							'All the backups are safely stored in the cloud and available for you at any time on Jetpack.com, with full details about status and content.',
							'jetpack-backup-pkg'
						) }
					</p>
					{ hasBackupPlan() && (
						<>
							<p>
								<a
									href={ getRedirectUrl( 'jetpack-backup', { site: domain } ) }
									target="_blank"
									rel="noreferrer"
								>
									{ __( 'See all your backups', 'jetpack-backup-pkg' ) }
								</a>
							</p>
						</>
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
							<a
								href={ getRedirectUrl( 'backup-plugin-activity-log', { site: domain } ) }
								target="_blank"
								rel="noreferrer"
							>
								{ __( "See your site's activity", 'jetpack-backup-pkg' ) }
							</a>
						</p>
					) }
				</Col>
			</Container>
		);
	};

	const renderContent = () => {
		return (
			<div className="content">
				<AdminSectionHero>{ renderLoadedState() }</AdminSectionHero>
				<AdminSection>{ isFullyConnected() && renderBackupSegments() }</AdminSection>
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
				{ renderContent() }
			</div>
		</AdminPage>
	);
};

export default Admin;
