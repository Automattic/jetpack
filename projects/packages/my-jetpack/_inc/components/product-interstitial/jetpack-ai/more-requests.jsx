/**
 * External dependencies
 */
import {
	AdminPage,
	Col,
	Container,
	Text,
	H3,
	getRedirectUrl,
} from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Button } from '@wordpress/ui';
import clsx from 'clsx';
import { useCallback } from 'react';
import { Link } from 'react-router';
/**
 * Internal dependencies
 */
import useAnalytics from '../../../hooks/use-analytics';
import GoBackLink from '../../go-back-link';
import jetpackAiImage from '../assets/jetpack-ai.webp';
import styles from './style.module.scss';

/**
 * JetpackAIInterstitialMoreRequests component
 *
 * @param {object}   props               - Component props.
 * @param {Function} props.onClickGoBack - onClick handler for the "Back" button.
 * @return {object}                       JetpackAIInterstitialMoreRequests react component.
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
		<AdminPage
			showBackground={ false }
			breadcrumbs={
				<GoBackLink
					onClick={ onClickGoBack }
					to="/products"
					label={ __( 'My Jetpack', 'jetpack-my-jetpack' ) }
				/>
			}
		>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
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
										<Button
											nativeButton={ false }
											render={ <a href={ contactHref } /> }
											onClick={ trackClickHandler }
										>
											{ __( 'Contact Us', 'jetpack-my-jetpack' ) }
										</Button>
										<Button
											variant="outline"
											nativeButton={ false }
											render={ <Link to="/products" onClick={ onClickGoBack } /> }
										>
											{ __( 'Back', 'jetpack-my-jetpack' ) }
										</Button>
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
