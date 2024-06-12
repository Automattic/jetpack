import { getIconBySlug, JetpackLogo, Button, Col, Container } from '@automattic/jetpack-components';
import { Modal } from '@wordpress/components';
import { __, _x, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import React, { useCallback, useRef, useState, useEffect } from 'react';
import styles from './styles.module.scss';

const onModalCloseDefault = event => {
	if ( document.referrer.includes( window.location.host ) ) {
		// Prevent default here to minimize page change within the My Jetpack app.
		event.preventDefault();
		history.back();
	} else {
		// If noreferrer, redirect to the My Jetpack dashboard.
		event.preventDefault();
		window.location.href = window?.myJetpackInitialState?.myJetpackUrl;
	}
};

/**
 * Component that displays a golden token experience.
 *
 * @param {object} props - Component props.
 * @param {Function} props.redeemClick - Callback function to handle redeem click.
 * @param {object} props.displayName - Connected user data.
 * @param {Function} props.onModalClose - Callback function to handle module closure.
 * @param {Function} props.tokenRedeemed - If their token is already redeemed.
 * @returns {React.Component} - GoldenToken component.
 */
function GoldenTokenModal( {
	redeemClick,
	displayName,
	onModalClose = onModalCloseDefault,
	tokenRedeemed = false,
} ) {
	const [ hasAnimated, setIsAnimating ] = useState( false );
	const videoRef = useRef( null );

	useEffect( () => {
		setTimeout( () => {
			videoRef?.current?.play();
		}, 500 );
	}, [ videoRef ] );

	const ScanIcon = getIconBySlug( 'scan' );
	const VaultPressBackupIcon = getIconBySlug( 'backup' );

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

	const modalClassName = clsx( styles.modal, {
		[ styles.animating ]: hasAnimated,
	} );

	return (
		<div>
			<Modal
				className={ modalClassName }
				onRequestClose={ onModalClose }
				isDismissible={ false }
				__experimentalHideHeader={ true }
			>
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
								muted="muted"
							/>
						</div>

						<div className={ styles[ 'content-wrap' ] }>
							<div className={ styles[ 'content-wrap-text' ] }>
								{ displayName.length > 0 && (
									<p className={ styles[ 'hi-user' ] }>
										{ sprintf(
											/* Translators: %s is the user's display name. */
											__( 'Hey, %s', 'jetpack' ),
											displayName
										) }
									</p>
								) }
								<h2 className={ styles.headline }>
									{ __( 'You have been gifted a Jetpack Golden Token.', 'jetpack' ) }
								</h2>
								<p>
									{ tokenRedeemed &&
										__(
											'This unlocked a lifetime of Jetpack powers for your website. Your exclusive Jetpack Experience is already active.',
											'jetpack'
										) }
									{ ! tokenRedeemed &&
										__(
											'This unlocks a lifetime of Jetpack powers for your website. Your exclusive Jetpack Experience awaits.',
											'jetpack'
										) }
								</p>
							</div>
							<Button
								variant="primary"
								weight="regular"
								onClick={ redeemClickHandler }
								className={ styles.button }
							>
								{ tokenRedeemed && __( 'Awesome!', 'jetpack' ) }
								{ ! tokenRedeemed && __( 'Redeem your token', 'jetpack' ) }
							</Button>
						</div>

						<div className={ `${ styles[ 'powers-wrap' ] } ${ styles[ 'content-wrap' ] }` }>
							<div className={ styles[ 'content-wrap-text' ] }>
								<h2 className={ styles.headline }>
									{ __( 'Super powers are ready!', 'jetpack' ) }
								</h2>
								<p className={ styles.paragraph }>
									{ __(
										'Your Jetpack Golden Token provides a lifetime license for this website and includes the following products:',
										'jetpack'
									) }
								</p>
							</div>

							<div className={ styles[ 'jetpack-products' ] }>
								<div>
									<VaultPressBackupIcon />

									<h3>{ __( 'VaultPress Backup', 'jetpack' ) }</h3>
									<p>
										{ __(
											'Save every change and get back online quickly with one‑click restores.',
											'jetpack'
										) }
									</p>
								</div>
								<div>
									<ScanIcon />

									<h3>{ _x( 'Scan', 'Plugin name (noun).', 'jetpack' ) }</h3>
									<p>
										{ __(
											'Automated scanning and one‑click fixes to keep your site ahead of security threats.',
											'jetpack'
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
								{ __( 'Explore your new powers', 'jetpack' ) }
							</Button>
						</div>
					</Col>
				</Container>
			</Modal>
		</div>
	);
}

GoldenTokenModal.propTypes = {
	redeemClick: PropTypes.func,
	tokenRedeemed: PropTypes.bool,
	displayName: PropTypes.string,
	onModalClose: PropTypes.func,
};

export default GoldenTokenModal;
