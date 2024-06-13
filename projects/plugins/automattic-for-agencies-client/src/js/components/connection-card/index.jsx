import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectButton } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import React, { useCallback, useState } from 'react';
import BrandedCard from '../branded-card';
import CheckIcon from '../check-icon';
import LeftArrow from '../left-arrow';
import styles from './styles.module.scss';

/**
 * Site Connection Content
 * The main copy for the connection card.
 *
 * @param {object}   props                             - Component props
 * @param {Function} props.onShowSharingDetailsClick  - Callback to show the sharing details.
 *
 * @returns {React.Component} The `ConnectionContent` component.
 */
function ConnectionContent( { onShowSharingDetailsClick } ) {
	const { apiNonce, apiRoot, registrationNonce } = window.automatticForAgenciesClientInitialState;
	return (
		<>
			<h1>
				{ __(
					'Add this site to Automattic for Agencies by connecting now',
					'automattic-for-agencies-client'
				) }
			</h1>
			<ul className={ styles.checklist }>
				<li>
					<CheckIcon />
					{ __( 'See your site in the Sites dashboard', 'automattic-for-agencies-client' ) }
				</li>
				<li>
					<CheckIcon />
					{ __(
						'View any security and performance issues across all of your sites',
						'automattic-for-agencies-client'
					) }
				</li>
				<li>
					<CheckIcon />
					{ __(
						'Update plugins across all sites in a couple of clicks',
						'automattic-for-agencies-client'
					) }
				</li>
				<li>
					<CheckIcon />
					{ __( 'Receive instant downtime alerts', 'automattic-for-agencies-client' ) }
				</li>
				<li>
					<CheckIcon />
					{ __( 'And more', 'automattic-for-agencies-client' ) }
				</li>
			</ul>
			<div className={ styles[ 'site-connection' ] }>
				<div className={ styles[ 'terms-of-service' ] }>
					{ createInterpolateElement(
						__(
							'By clicking <strong>connect this site</strong>, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>sync your site‘s data</shareDetailsLink> with us.',
							'automattic-for-agencies-client'
						),
						{
							strong: <strong />,
							tosLink: (
								<a
									className={ styles[ 'terms-of-service__link' ] }
									href={ getRedirectUrl( 'wpcom-tos' ) }
									rel="noopener noreferrer"
									target="_blank"
								/>
							),
							shareDetailsLink: (
								<button
									className="components-button is-link"
									onClick={ onShowSharingDetailsClick }
								/>
							),
						}
					) }
				</div>
				<div className={ styles[ 'connect-button-wrapper' ] }>
					<ConnectButton
						connectLabel={ __( 'Connect this site', 'automattic-for-agencies-client' ) }
						apiRoot={ apiRoot }
						apiNonce={ apiNonce }
						registrationNonce={ registrationNonce }
						from="automattic-for-agencies-client"
						redirectUri="options-general.php?page=automattic-for-agencies-client"
					/>
				</div>
			</div>
		</>
	);
}

/**
 * Detail Sharing Content
 * The copy for the "sync your site‘s data" information linked from the TOS.
 *
 * @param {object}   props                             - Component props
 * @param {Function} props.onCloseSharingDetailsClick  - Callback to close the sharing details.
 *
 * @returns {React.Component} The `DetailSharingContent` component.
 */
function DetailSharingContent( { onCloseSharingDetailsClick } ) {
	return (
		<>
			<div>
				<button
					className="components-button components-button--back is-link"
					onClick={ onCloseSharingDetailsClick }
				>
					<LeftArrow />
					{ __( 'Go back to site connection', 'automattic-for-agencies-client' ) }
				</button>
			</div>
			<div className={ styles.card__prose }>
				<h2>
					{ __(
						'What data is synced between your site and WordPress.com',
						'automattic-for-agencies-client'
					) }
				</h2>
				<p>
					{ __(
						'Your privacy matters to us. We only collect the data necessary to provide your Automattic for Agencies portal experience.',
						'automattic-for-agencies-client'
					) }
				</p>
			</div>
			<ul className={ styles.checklist }>
				<li>
					<CheckIcon />
					<div>
						{ createInterpolateElement(
							__(
								'<strong>Options:</strong> To sync specific site options (and constants) that help us identify the changes to the features we power.',
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</div>
				</li>
				<li>
					<CheckIcon />
					<div>
						{ createInterpolateElement(
							__(
								'<strong>Updates:</strong> To sync data about plugin, theme, and core updates and enable updating these from the Automattic for Agencies portal.',
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</div>
				</li>
				<li>
					<CheckIcon />
					<div>
						{ createInterpolateElement(
							__(
								'<strong>Plugins:</strong> To sync plugin data, such as deletions and installations.',
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</div>
				</li>
				<li>
					<CheckIcon />
					<div>
						{ createInterpolateElement(
							__(
								"<strong>Users:</strong> To sync information on the site's users and any related changes. This will be used for user management in the future.",
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</div>
				</li>
				<li>
					<CheckIcon />
					<div>
						{ createInterpolateElement(
							__(
								'<strong>Stats:</strong> To sync heartbeat data. This is used to power downtime monitoring and the last 7-day stats charts.',
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</div>
				</li>
			</ul>
		</>
	);
}

/**
 * Connection Card component.
 *
 * @returns {React.Component} The `ConnectionCard` component.
 */
export default function ConnectionCard() {
	// Toggle the card content between the default connection content and the sharing details content linked from the TOS.
	const [ showSharingDetails, setShowSharingDetails ] = useState( false );
	const onShowSharingDetailsClick = useCallback( () => setShowSharingDetails( true ), [] );
	const onCloseSharingDetailsClick = useCallback( () => setShowSharingDetails( false ), [] );

	return (
		<BrandedCard>
			<div
				className={ clsx( styles.card, {
					[ styles[ 'card--sharing' ] ]: showSharingDetails,
					[ styles[ 'card--connection' ] ]: ! showSharingDetails,
				} ) }
			>
				{ showSharingDetails ? (
					<DetailSharingContent onCloseSharingDetailsClick={ onCloseSharingDetailsClick } />
				) : (
					<ConnectionContent onShowSharingDetailsClick={ onShowSharingDetailsClick } />
				) }
			</div>
		</BrandedCard>
	);
}
