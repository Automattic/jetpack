import { getIconBySlug, JetpackLogo, Button, Col, Container } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __, sprintf } from '@wordpress/i18n';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useRef, useState } from 'react';
import styles from './styles.module.scss';
import './styles.scss';

/**
 * Component that displays a golden token experience.
 *
 * @param {object} props - Component props.
 * @param {Function} props.redeemClick - Callback function to handle redeem click.
 * @param {object} props.userConnectionData - Connected user data.
 * @param {Function} props.onModalClose - Callback function to handle module closure.
 * @param {Array} props.purchases - Array of Object of purchases.
 * @param {boolean} props.fetchingPurchases - Are purchases being fetched.
 * @returns {React.Component} - GoldenToken component.
 */
function GoldenTokenModal( {
	redeemClick,
	userConnectionData,
	onModalClose,
	fetchingPurchases,
	purchases,
} ) {
	const [ hasAnimated, setIsAnimating ] = useState( false );
	const videoRef = useRef( null );

	const ScanIcon = getIconBySlug( 'scan' );
	const VaultPressBackupIcon = getIconBySlug( 'backup' );

	// Any purchase with the partner_slug of 'goldenticket' is considered a golden token.
	const goldenToken = purchases.filter( golden => golden.partner_slug === 'goldenticket' );
	const hasGoldenToken = goldenToken.length > 0;

	const redeemClickHandler = useCallback(
		e => {
			redeemClick?.( e );
			setIsAnimating( true );
			videoRef.current.play();
		},
		[ videoRef, redeemClick ]
	);

	const maybeReanimate = useCallback( () => {
		hasAnimated && videoRef.current.play();
	}, [ hasAnimated ] );

	const modalClassName = classNames( styles.modal, {
		[ styles.animating ]: hasAnimated,
	} );

	// They might not have a display name set in wpcom, so fall back to wpcom login or local username.
	const wpcomUserName =
		userConnectionData?.currentUser?.wpcomUser?.display_name ||
		userConnectionData?.currentUser?.wpcomUser?.login ||
		userConnectionData?.currentUser?.username;

	return (
		<Modal
			className={ modalClassName }
			onRequestClose={ onModalClose }
			isDismissible={ false }
			__experimentalHideHeader={ true }
		>
			{ fetchingPurchases && <>{ __( 'Checking gold status…', 'jetpack-my-jetpack' ) }</> }
			{ ! fetchingPurchases && hasGoldenToken && (
				<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
					<Col>
						<JetpackLogo className={ styles[ 'jetpack-logo' ] } />
						<div
							className={ styles[ 'video-wrap' ] }
							onClick={ maybeReanimate }
							role="presentation"
						>
							{ /* eslint-disable-next-line jsx-a11y/media-has-caption */ }
							<video
								ref={ videoRef }
								src="https://videos.files.wordpress.com/oSlNIBQO/jetpack-golden-token.mp4"
							/>
						</div>

						<div className={ styles[ 'content-wrap' ] }>
							<div className={ styles[ 'content-wrap-text' ] }>
								<p className={ styles[ 'hi-user' ] }>
									{ sprintf(
										/* Translators: %s is the user's display name. */
										__( 'Hey, %s', 'jetpack-my-jetpack' ),
										wpcomUserName
									) }
								</p>
								<h2 className={ styles.headline }>
									{ __( 'You have been gifted a Jetpack Gold Token.', 'jetpack-my-jetpack' ) }
								</h2>
								<p>
									{ __(
										'This unlocks a lifetime of Jetpack powers for your website. Your exclusive Jetpack Experience awaits.',
										'jetpack-my-jetpack'
									) }
								</p>
							</div>
							<Button
								variant="primary"
								weight="regular"
								onClick={ redeemClickHandler }
								className={ styles.button }
							>
								{ __( 'Redeem your token', 'jetpack-my-jetpack' ) }
							</Button>
						</div>

						<div className={ `${ styles[ 'powers-wrap' ] } ${ styles[ 'content-wrap' ] }` }>
							<div className={ styles[ 'content-wrap-text' ] }>
								<h2 className={ styles.headline }>
									{ __( 'Super powers are ready!', 'jetpack-my-jetpack' ) }
								</h2>
								<p className={ styles.paragraph }>
									{ __(
										'Your Jetpack Gold Token provides a lifetime license for this website and includes the following products:',
										'jetpack-my-jetpack'
									) }
								</p>
							</div>

							<div className={ styles[ 'jetpack-products' ] }>
								<div>
									<VaultPressBackupIcon />

									<h3>{ __( 'VaultPress Backup', 'jetpack-my-jetpack' ) }</h3>
									<p>
										{ __(
											'Save every change and get back online quickly with one‑click restores.',
											'jetpack-my-jetpack'
										) }
									</p>
								</div>
								<div>
									<ScanIcon />

									<h3>{ __( 'Scan', 'jetpack-my-jetpack' ) }</h3>
									<p>
										{ __(
											'Automated scanning and one‑click fixes to keep your site ahead of security threats.',
											'jetpack-my-jetpack'
										) }
									</p>
								</div>
							</div>

							<Button
								variant="primary"
								weight="regular"
								onClick={ redeemClickHandler }
								href={ window?.myJetpackInitialState?.myJetpackUrl }
								className={ styles.button }
							>
								{ __( 'Explore your new powers', 'jetpack-my-jetpack' ) }
							</Button>
						</div>
					</Col>
				</Container>
			) }
			{ /* TODO: fetchingPurchases is always false if loading the page directly, so this shows for a very brief moment. */ }
			{ ! fetchingPurchases && ! hasGoldenToken && (
				<div> { __( 'Sorry, no token…', 'jetpack-my-jetpack' ) } </div>
			) }
		</Modal>
	);
}

GoldenTokenModal.propTypes = {
	redeemClick: PropTypes.func,
	fetchingPurchases: PropTypes.bool,
	purchases: PropTypes.array,
	userConnectionData: PropTypes.object.isRequired,
	onModalClose: PropTypes.func.isRequired,
};

export default GoldenTokenModal;
