/**
 * External dependencies
 */
import {
	AdminPage,
	Button,
	Col,
	Container,
	Text,
	H3,
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import clsx from 'clsx';
import React, { useCallback } from 'react';
import { Link } from 'react-router-dom';
/**
 * Internal dependencies
 */
import useAnalytics from '../../../hooks/use-analytics';
import GoBackLink from '../../go-back-link';
import jetpackAiImage from '../jetpack-ai.png';
import styles from './style.module.scss';

/**
 * JetpackAIInterstitialMoreRequests component
 *
 * @param {object} props                 - Component props.
 * @param {Function} props.onClickGoBack - onClick handler for the "Back" button.
 * @returns {object}                       JetpackAIInterstitialMoreRequests react component.
 */
export function JetpackAIInterstitialMoreRequests( { onClickGoBack = () => {} } ) {
	const title = __( 'Do you need more requests for Jetpack AI Assistant?', 'jetpack-my-jetpack' );
	const longDescription = __(
		'Allow us to assist you in discovering the optimal plan tailored to your requirements, ensuring you can continue using the most advanced AI technology Jetpack has to offer.',
		'jetpack-my-jetpack'
	);
	const contactHref = getRedirectUrl( 'jetpack-ai-tiers-more-requests-contact' );
	const { recordEvent } = useAnalytics();
	const trackClickHandler = useCallback( () => {
		recordEvent( 'jetpack_ai_upgrade_contact_us', { placement: 'insterstitial' } );
	}, [ recordEvent ] );

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col className={ styles[ 'product-interstitial__header' ] }>
					<GoBackLink onClick={ onClickGoBack } reload={ false } />
				</Col>
				<Col>
					<Container
						className={ styles.container }
						horizontalSpacing={ 0 }
						horizontalGap={ 0 }
						fluid
					>
						<Col sm={ 4 } md={ 4 } lg={ 7 }>
							<div className={ clsx( styles.card ) }>
								<div>
									<H3>{ title }</H3>
									<Text mb={ 3 }>{ longDescription }</Text>
									<div className={ styles[ 'buttons-row' ] }>
										<Button href={ contactHref } onClick={ trackClickHandler }>
											{ __( 'Contact Us', 'jetpack-my-jetpack' ) }
										</Button>
										<Link to={ '/' } onClick={ onClickGoBack }>
											<Button variant="secondary">{ __( 'Back', 'jetpack-my-jetpack' ) }</Button>
										</Link>
									</div>
								</div>
							</div>
						</Col>
						<Col
							sm={ 4 }
							md={ 4 }
							lg={ 5 }
							className={ clsx( styles.imageContainer, styles.aiImageContainer ) }
						>
							<img src={ jetpackAiImage } alt="Jetpack AI" />
						</Col>
					</Container>
				</Col>
			</Container>
		</AdminPage>
	);
}
