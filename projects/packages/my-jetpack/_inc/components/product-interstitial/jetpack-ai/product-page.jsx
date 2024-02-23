/**
 * External dependencies
 */
import { AdminPage, Col, Container, JetpackLogo } from '@automattic/jetpack-components';
import { Card } from '@wordpress/components';
import classnames from 'classnames';
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

	return (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container
				fluid
				horizontalSpacing={ 3 }
				horizontalGap={ 3 }
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
							AI Assistant
						</div>
					</div>
				</Col>
				<Col
					className={ classnames(
						styles[ 'product-interstitial__hero-section' ],
						styles[ 'product-interstitial__section' ]
					) }
				>
					<div className={ styles[ 'product-interstitial__hero-content' ] }>
						<h1 className={ styles[ 'product-interstitial__hero-heading' ] }>{ description }</h1>
						<div className={ styles[ 'product-interstitial__hero-sub-heading' ] }>
							Draft, transform, translate, and alter both new and existing content leveraging the
							capabilities of AI, inside the block editor.
						</div>
					</div>
					<div className={ styles[ 'product-interstitial__hero-side' ] }>
						<Card className={ styles[ 'stats-card' ] }>Hello</Card>
						<Card className={ styles[ 'stats-card' ] }>Hello</Card>
					</div>
				</Col>
				<Col className={ styles[ 'product-interstitial__section' ] }>
					<div className={ styles[ 'product-interstitial__section-wrapper' ] }>
						<h2 className={ styles[ 'product-interstitial__section-heading' ] }>AI Features</h2>
						<p className={ styles[ 'product-interstitial__section-sub-heading' ] }>
							Discover all the Jetpack features powered by AI
						</p>
						<div>presentational card with video</div>
						<div>presentational card with video</div>
						<div>presentational card with video</div>
					</div>
				</Col>
				<Col className={ styles[ 'product-interstitial__section' ] }>
					<div className={ styles[ 'product-interstitial__section-wrapper' ] }>
						<h2 className={ styles[ 'product-interstitial__section-heading' ] }>
							Do you have any feedback?
						</h2>
						<p className={ styles[ 'product-interstitial__section-sub-heading' ] }>
							Help us improving the accuracy of our results and feel free to give us ideas for
							future implementations and improvements. Share your feedback!
						</p>
					</div>
				</Col>
			</Container>
		</AdminPage>
	);
}
