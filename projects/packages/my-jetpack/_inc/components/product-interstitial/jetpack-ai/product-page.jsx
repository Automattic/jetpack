/**
 * External dependencies
 */
import { AdminPage, Col, Container, JetpackLogo, AiIcon } from '@automattic/jetpack-components';
import { Button, Card } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Icon, plus, help, check } from '@wordpress/icons';
import classnames from 'classnames';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import { useGoBack } from '../../../hooks/use-go-back';
import { useProduct } from '../../../hooks/use-product';
import GoBackLink from '../../go-back-link';
import styles from './style.module.scss';

/**
 * Product Page for Jetpack AI
 * @returns {object} React component for the product page
 */
export default function () {
	const { onClickGoBack } = useGoBack( 'jetpack-ai' );
	const { detail } = useProduct( 'jetpack-ai' );
	const { description } = detail;

	const videoTitle1 = __(
		'Generate and edit content faster with Jetpack AI Assistant',
		'jetpack-my-jetpack'
	);
	const videoTitle2 = __( 'Build forms using prompts', 'jetpack-my-jetpack' );
	const videoTitle3 = __( 'Get feedback on posts', 'jetpack-my-jetpack' );

	const onCreateClick = useCallback( () => {
		// console.log( 'click' );
	}, [] );

	return (
		<AdminPage showHeader={ false } showBackground={ true }>
			<Container
				fluid
				horizontalSpacing={ 3 }
				horizontalGap={ 2 }
				className={ styles[ 'product-interstitial__container' ] }
			>
				<Col className={ classnames( styles[ 'product-interstitial__section' ] ) }>
					<div className={ styles[ 'product-interstitial__section-wrapper-wide' ] }>
						<GoBackLink onClick={ onClickGoBack } />
					</div>
					<div
						className={ classnames(
							styles[ 'product-interstitial__section-wrapper-wide' ],
							styles[ 'product-interstitial__product-header' ]
						) }
					>
						<JetpackLogo />
						<div className={ styles[ 'product-interstitial__product-header-name' ] }>
							{ __( 'AI Assistant', 'jetpack-my-jetpack' ) }
						</div>
					</div>
				</Col>
				<Col className={ classnames( styles[ 'product-interstitial__section' ] ) }>
					<div className={ styles[ 'product-interstitial__hero-section' ] }>
						<div className={ styles[ 'product-interstitial__hero-content' ] }>
							<h1 className={ styles[ 'product-interstitial__hero-heading' ] }>{ description }</h1>
							<div className={ styles[ 'product-interstitial__hero-sub-heading' ] }>
								{ __(
									'Draft, transform, translate, and alter both new and existing content leveraging the capabilities of AI, inside the block editor.',
									'jetpack-my-jetpack'
								) }
							</div>
							<Button
								variant="primary"
								onClick={ onCreateClick }
								className={ styles[ 'product-interstitial__hero-cta' ] }
							>
								{ __( 'Get more requests', 'jetpack-my-jetpack' ) }
							</Button>
						</div>
						<div className={ styles[ 'product-interstitial__hero-side' ] }>
							<Card className={ styles[ 'stats-card' ] }>
								<AiIcon />
								<div>
									<div className={ styles[ 'product-interstitial__stats-card-text' ] }>
										{ __( 'Requests for this month', 'jetpack-my-jetpack' ) }
									</div>
									<div className={ styles[ 'product-interstitial__stats-card-value' ] }>
										{ '234' }
									</div>
								</div>
							</Card>
							<Card className={ styles[ 'stats-card' ] }>
								<Icon icon={ check } className={ styles[ 'stats-card-icon-check' ] } />
								<div>
									<div className={ styles[ 'product-interstitial__stats-card-text' ] }>
										{ __( 'All-time requests used', 'jetpack-my-jetpack' ) }
									</div>
									<div className={ styles[ 'product-interstitial__stats-card-value' ] }>
										{ '234' }
									</div>
								</div>
							</Card>
						</div>
					</div>
				</Col>
				<Col className={ styles[ 'product-interstitial__section' ] }>
					<div className={ styles[ 'product-interstitial__section-wrapper' ] }>
						<h2 className={ styles[ 'product-interstitial__section-heading' ] }>
							{ __( 'AI Features', 'jetpack-my-jetpack' ) }
						</h2>
						<p className={ styles[ 'product-interstitial__section-sub-heading' ] }>
							{ __( 'Discover all the Jetpack features powered by AI', 'jetpack-my-jetpack' ) }
						</p>
						<div className={ styles[ 'product-interstitial__usage-videos' ] }>
							<div className={ styles[ 'product-interstitial__usage-videos-item' ] }>
								<div className={ styles[ 'product-interstitial__usage-videos-video' ] }>
									<iframe
										width="280"
										height="157"
										src="https://videopress.com/embed/GdXmtVtW?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F02%2Fimage-37.png%3Fw%3D560"
										frameborder="0"
										allowFullScreen
										allow="clipboard-write"
										title={ videoTitle1 }
									></iframe>
									<script src="https://videopress.com/videopress-iframe.js"></script>
								</div>
								<div className={ styles[ 'product-interstitial__usage-videos-content' ] }>
									<div className={ styles[ 'product-interstitial__usage-videos-heading' ] }>
										{ videoTitle1 }
									</div>
									<div className={ styles[ 'product-interstitial__usage-videos-text' ] }>
										{ __(
											'Use the AI block to generate content, or use our AI edit options in existing blocks. Use prompts or any of our recommended actions.',
											'jetpack-my-jetpack'
										) }
									</div>
									<Button
										className={ styles[ 'product-interstitial__usage-videos-link' ] }
										icon={ plus }
										onClick={ onCreateClick }
									>
										{ __( 'Create new post', 'jetpack-my-jetpack' ) }
									</Button>
								</div>
							</div>
							<div className={ styles[ 'product-interstitial__usage-videos-item' ] }>
								<div className={ styles[ 'product-interstitial__usage-videos-video' ] }>
									<iframe
										width="280"
										height="157"
										src="https://videopress.com/embed/GdXmtVtW?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F02%2Fimage-38.png%3Fw%3D560"
										frameborder="0"
										allowFullScreen
										allow="clipboard-write"
										title={ videoTitle2 }
									></iframe>
									<script src="https://videopress.com/videopress-iframe.js"></script>
								</div>
								<div className={ styles[ 'product-interstitial__usage-videos-content' ] }>
									<div className={ styles[ 'product-interstitial__usage-videos-heading' ] }>
										{ videoTitle2 }
									</div>
									<div className={ styles[ 'product-interstitial__usage-videos-text' ] }>
										{ __(
											'Quickly build forms using the Jetpack Forms block and AI. Use prompts to describe your form and AI will generate the elements in a few seconds.',
											'jetpack-my-jetpack'
										) }
									</div>
									<Button
										className={ styles[ 'product-interstitial__usage-videos-link' ] }
										icon={ help }
										onClick={ onCreateClick }
									>
										{ __( 'Learn about forms', 'jetpack-my-jetpack' ) }
									</Button>
								</div>
							</div>
							<div className={ styles[ 'product-interstitial__usage-videos-item' ] }>
								<div className={ styles[ 'product-interstitial__usage-videos-video' ] }>
									<iframe
										width="280"
										height="157"
										src="https://videopress.com/embed/GdXmtVtW?posterUrl=https%3A%2F%2Fjetpackme.files.wordpress.com%2F2024%2F02%2Fimage-39.png%3Fw%3D560"
										frameborder="0"
										allowFullScreen
										allow="clipboard-write"
										title={ videoTitle3 }
									></iframe>
									<script src="https://videopress.com/videopress-iframe.js"></script>
								</div>
								<div className={ styles[ 'product-interstitial__usage-videos-content' ] }>
									<div className={ styles[ 'product-interstitial__usage-videos-heading' ] }>
										{ videoTitle3 }
									</div>
									<div className={ styles[ 'product-interstitial__usage-videos-text' ] }>
										{ __(
											'Get instant feedback on your post before publishing. AI will read your post and highlight opportunities to improve your publication.',
											'jetpack-my-jetpack'
										) }
									</div>
									<Button
										className={ styles[ 'product-interstitial__usage-videos-link' ] }
										icon={ help }
										onClick={ onCreateClick }
									>
										{ __( 'Learn more', 'jetpack-my-jetpack' ) }
									</Button>
								</div>
							</div>
						</div>
					</div>
				</Col>
				<Col className={ styles[ 'product-interstitial__section' ] }>
					<div className={ styles[ 'product-interstitial__section-wrapper' ] }>
						<div className={ styles[ 'product-interstitial__section-emoji' ] }>👋</div>
						<h2 className={ styles[ 'product-interstitial__section-heading' ] }>
							{ __( 'Do you have any feedback?', 'jetpack-my-jetpack' ) }
						</h2>
						<p className={ styles[ 'product-interstitial__section-sub-heading' ] }>
							{ __(
								'Help us improving the accuracy of our results and feel free to give us ideas for future implementations and improvements.',
								'jetpack-my-jetpack'
							) }{ ' ' }
							<a href="#" target="_blank" rel="noreferer noopener">
								{ __( 'Share your feedback!', 'jetpack-my-jetpack' ) }
							</a>
						</p>
					</div>
				</Col>
			</Container>
		</AdminPage>
	);
}
