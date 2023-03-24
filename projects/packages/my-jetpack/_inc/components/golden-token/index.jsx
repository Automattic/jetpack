import { Button } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { useCallback, useRef, useState } from 'react';
import { JetpackBackupLogo, JetpackLogo, JetpackScanLogo } from './logos';
import styles from './styles.module.scss';

/**
 * Component that displays a golden token experience.
 *
 * @param {object} props - Component props.
 * @param {Function} props.redeemClick - Callback function to handle redeem click.
 * @param {boolean} props.hasGoldenToken - Whether the user has a golden token.
 * @returns {React.Component} - GoldenToken component.
 */
function GoldenToken( { redeemClick, hasGoldenToken } ) {
	const [ isAnimating, setIsAnimating ] = useState( false );
	const videoRef = useRef( null );

	const redeemClickHandler = useCallback(
		e => {
			redeemClick?.( e );

			setIsAnimating( true );
			videoRef.current.play();
		},
		[ redeemClick, videoRef ]
	);

	if ( ! hasGoldenToken ) {
		return <div>No token. Try harder.</div>;
	}

	const modalClassName = classNames( styles.modal, {
		[ styles.animating ]: isAnimating,
	} );

	return (
		<div className={ modalClassName }>
			<JetpackLogo className={ styles[ 'jetpack-logo' ] } />
			<div className={ styles[ 'video-wrap' ] }>
				{ /* eslint-disable-next-line jsx-a11y/media-has-caption */ }
				<video
					ref={ videoRef }
					src="https://videos.files.wordpress.com/oSlNIBQO/jetpack-golden-token.mp4"
				/>
			</div>

			<div className={ styles[ 'content-wrap' ] }>
				<div className={ styles[ 'content-wrap-text' ] }>
					<p className={ styles[ 'hi-user' ] }>Hey, Jetpack Friend</p>
					<h2 className={ styles.headline }>
						{ __( 'Your exclusive Jetpack Experience awaits.', 'jetpack-my-jetpack' ) }
					</h2>
					<p>
						{ __(
							'You have been gifted a Jetpack Gold Token. This unlocks a lifetime of Jetpack powers for your website.',
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
						<JetpackBackupLogo />

						<h3>{ __( 'VaultPress Backup', 'jetpack-my-jetpack' ) }</h3>
						<p>
							{ __(
								'Save every change and get back online quickly with one‑click restores.',
								'jetpack-my-jetpack'
							) }
						</p>
					</div>
					<div>
						<JetpackScanLogo />

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
					href={ window?.myJetpackInitialState?.myJetpackUrl }
					className={ styles.button }
				>
					{ __( 'Explore your new powers', 'jetpack-my-jetpack' ) }
				</Button>
			</div>
		</div>
	);
}

GoldenToken.propTypes = {
	redeemClick: PropTypes.func,
	hasGoldenToken: PropTypes.bool.isRequired,
};

export default GoldenToken;
