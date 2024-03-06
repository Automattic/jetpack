/**
 * External dependencies
 */
import { AdminPage, Col, Container, JetpackLogo } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import ProductInterstitial from '../';
import useProduct from '../../../data/products/use-product';
import { useGoBack } from '../../../hooks/use-go-back';
import GoBackLink from '../../go-back-link';
import AiTierDetailTable from '../../product-detail-table/jetpack-ai';
import jetpackAiImage from '../jetpack-ai.png';
import styles from './style.module.scss';

const debug = debugFactory( 'my-jetpack:product-interstitial:jetpack-ai' );
/**
 * JetpackAiInterstitial component
 *
 * @returns {object} JetpackAiInterstitial react component.
 */
export default function JetpackAiInterstitial() {
	const slug = 'jetpack-ai';
	const { detail } = useProduct( slug );
	const { onClickGoBack } = useGoBack( { slug } );
	const { isRegistered } = useConnection();
	debug( useProduct( slug ) );
	debug( detail );
	const nextTier = detail?.aiAssistantFeature?.nextTier || null;

	const { tiers, hasRequiredPlan } = detail;

	// Default to 100 requests if the site is not registered/connected.
	const nextTierValue = isRegistered ? nextTier?.value : 100;
	// Decide the quantity value for the upgrade, but ignore the unlimited tier.
	const quantity = nextTierValue !== 1 ? nextTierValue : null;

	// Highlight the last feature in the table for all the tiers except the unlimited one.
	const highlightLastFeature = nextTier?.value !== 1;

	return tiers && tiers.length && ! detail ? (
		<AdminPage showHeader={ false } showBackground={ true }>
			<Container fluid horizontalSpacing={ 3 } horizontalGap={ 2 }>
				<Col className={ styles[ 'product-interstitial__section' ] }>
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
				<Col className={ styles[ 'product-interstitial__section' ] }>
					<div className={ styles[ 'product-interstitial__section-wrapper-wide' ] }>
						<AiTierDetailTable />
					</div>
				</Col>
			</Container>
		</AdminPage>
	) : (
		<ProductInterstitial
			slug="jetpack-ai"
			installsPlugin={ true }
			imageContainerClassName={ styles.aiImageContainer }
			hideTOS={ true }
			quantity={ quantity }
			directCheckout={ hasRequiredPlan }
			highlightLastFeature={ highlightLastFeature }
		>
			<img src={ jetpackAiImage } alt="Search" />
		</ProductInterstitial>
	);
}
