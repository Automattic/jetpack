import { getRedirectUrl } from '@automattic/jetpack-components';
import { ConnectButton } from '@automattic/jetpack-connection';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import React, { useCallback, useState } from 'react';
import BrandedCard from '../branded-card';
import CheckIcon from '../check-icon';
import CloseIcon from '../close-icon';
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
							'By clicking the <strong>connect this site</strong> button, you agree to our <tosLink>Terms of Service</tosLink> and to <shareDetailsLink>share details</shareDetailsLink> with WordPress.com.',
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
						redirectUri="admin.php?page=automattic-for-agencies-client"
					/>
				</div>
			</div>
		</>
	);
}

/**
 * Detail Sharing Content
 * The copy for the "share details" information linked from the TOS.
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
				<h2>{ __( 'What data is synced from your site', 'automattic-for-agencies-client' ) }</h2>
				<p>
					{ __(
						'Your privacy matters to us. We sync only the necessary data required to provide our Automattic for Agencies portal experiences.',
						'automattic-for-agencies-client'
					) }
				</p>
			</div>
			<ul className={ styles.checklist }>
				<li>
					<CheckIcon />
					{ createInterpolateElement(
						__(
							'<strong>Options:</strong> to sync site options data.',
							'automattic-for-agencies-client'
						),
						{ strong: <strong /> }
					) }
				</li>
				<li>
					<CheckIcon />
					{ createInterpolateElement(
						__(
							'<strong>Callables:</strong> to sync for callables.',
							'automattic-for-agencies-client'
						),
						{ strong: <strong /> }
					) }
				</li>
				<li>
					<CheckIcon />
					{ createInterpolateElement(
						__(
							'<strong>Constants:</strong> to sync for constants.',
							'automattic-for-agencies-client'
						),
						{ strong: <strong /> }
					) }
				</li>
				<li>
					<CheckIcon />
					{ createInterpolateElement(
						__(
							'<strong>Full_Sync_Immediately:</strong> to do a full resync of the database.',
							'automattic-for-agencies-client'
						),
						{ strong: <strong /> }
					) }
				</li>
				<li>
					<CheckIcon />
					{ createInterpolateElement(
						__(
							'<strong>Updates:</strong> to sync data about plugin, theme, and core updates.',
							'automattic-for-agencies-client'
						),
						{ strong: <strong /> }
					) }
				</li>
				<li>
					<CheckIcon />
					{ createInterpolateElement(
						__(
							'<strong>Plugins:</strong> to sync plugin data such as deletions and installations.',
							'automattic-for-agencies-client'
						),
						{ strong: <strong /> }
					) }
				</li>
				<li>
					<CheckIcon />
					{ createInterpolateElement(
						__(
							'<strong>Users:</strong> to sync changes to users.',
							'automattic-for-agencies-client'
						),
						{ strong: <strong /> }
					) }
				</li>
				<li>
					<CheckIcon />
					{ createInterpolateElement(
						__(
							'<strong>Meta:</strong> to sync meta information users and other relevant objects.',
							'automattic-for-agencies-client'
						),
						{ strong: <strong /> }
					) }
				</li>
				<li>
					<CheckIcon />
					{ createInterpolateElement(
						__(
							'<strong>Stats:</strong> to sync heartbeat stats.',
							'automattic-for-agencies-client'
						),
						{ strong: <strong /> }
					) }
				</li>
			</ul>
			<div className={ styles.card__prose }>
				<h2>{ __( 'Data we will not sync', 'automattic-for-agencies-client' ) }</h2>
				<ul className={ styles.checklist }>
					<li>
						<CloseIcon />
						{ createInterpolateElement(
							__( '<strong>Posts:</strong> to sync post data.', 'automattic-for-agencies-client' ),
							{ strong: <strong /> }
						) }
					</li>
					<li>
						<CloseIcon />
						{ createInterpolateElement(
							__(
								'<strong>Comments:</strong> to sync comments data.',
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</li>
					<li>
						<CloseIcon />
						{ createInterpolateElement(
							__(
								'<strong>Attachments:</strong> to sync added and updated attachments.',
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</li>
					<li>
						<CloseIcon />
						{ createInterpolateElement(
							__(
								'<strong>Menus:</strong> to sync changes to the navigation menu.',
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</li>
					<li>
						<CloseIcon />
						{ createInterpolateElement(
							__(
								'<strong>Import:</strong> to sync after an import action.',
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</li>
					<li>
						<CloseIcon />
						{ createInterpolateElement(
							__(
								'<strong>Terms:</strong> to sync terms and taxonomy tables.',
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</li>
					<li>
						<CloseIcon />
						{ createInterpolateElement(
							__(
								'<strong>Term_Relationships:</strong> to sync terms and taxonomy relationships.',
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</li>
					<li>
						<CloseIcon />
						{ createInterpolateElement(
							__(
								'<strong>Network_Options:</strong> to sync multi-site network options.',
								'automattic-for-agencies-client'
							),
							{ strong: <strong /> }
						) }
					</li>
				</ul>
			</div>
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
				className={ classNames( styles.card, {
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
