/**
 * External dependencies
 */
import React, { useState, useCallback } from 'react';
import { __ } from '@wordpress/i18n';
import { Container, Col, PricingCard } from '@automattic/jetpack-components';
import { Modal, Button } from '@wordpress/components';

/**
 * Internal dependencies
 */
import styles from '../admin-page/styles.module.scss';

const { blogId } = window.wooAdsInitialState;

export const WooAdsRequireOptIn = () => {
	const [ showModalAcceptTerms, setShowModalAcceptTerms ] = useState( false );

	const handleOnModalOpen = useCallback( () => {
		setShowModalAcceptTerms( true );
	}, [] );

	const handleOnModalClose = useCallback( () => {
		setShowModalAcceptTerms( false );
	}, [] );

	const handleAcceptTerms = useCallback( () => {
		setShowModalAcceptTerms( false );
		window.location.href = `https://wordads.co/advertise/${ blogId }/create`;
	}, [] );

	return (
		<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
			<Col sm={ 4 } md={ 6 } lg={ 6 }>
				<h1 className={ styles.heading }>
					{ __( 'Start promoting your WooCommerce shop', 'wooads' ) }
				</h1>
				<ul className={ styles[ 'jp-product-wooads' ] }>
					<li>{ __( 'Get your items promoted to your target audience', 'wooads' ) }</li>
					<li>{ __( 'Pay after meeting your impression goal ', 'wooads' ) }</li>
				</ul>
			</Col>
			<Col lg={ 1 } md={ 1 } sm={ 0 } />
			<Col sm={ 4 } md={ 5 } lg={ 5 }>
				<PricingCard
					onCtaClick={ handleOnModalOpen }
					title={ __( 'WooAds', 'wooads' ) }
					priceBefore={ 9 }
					priceAfter={ 4.5 }
					ctaText={ __( 'Start Promoting', 'wooads' ) }
				/>
			</Col>
			{ showModalAcceptTerms && (
				<Modal
					onRequestClose={ handleOnModalClose }
					title={ __( 'Accept terms to start promoting', 'wooads' ) }
					className="jetpack-social-previews__modal"
				>
					<p>{ __( 'Terms of conditions', 'wooads' ) }:</p>
					<ul>
						<li>Term 1....</li>
					</ul>
					<Button
						shouldCloseOnEsc={ false }
						shouldCloseOnClickOutside={ false }
						variant="primary"
						text={ __( 'Accept', 'wooads' ) }
						onClick={ handleAcceptTerms }
					/>
				</Modal>
			) }
		</Container>
	);
};
