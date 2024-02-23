/**
 * External dependencies
 */
import { AdminPage, Col, Container, JetpackLogo } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import ProductInterstitial from '../';
import { useGoBack } from '../../../hooks/use-go-back';
import { useProduct } from '../../../hooks/use-product';
import GoBackLink from '../../go-back-link';
import AiTierDetailTable from '../../product-detail-table/jetpack-ai';
import jetpackAiImage from '../jetpack-ai.png';
import { JetpackAIInterstitialMoreRequests } from './more-requests';
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
	debug( detail );
	const nextTier = detail?.[ 'ai-assistant-feature' ]?.[ 'next-tier' ] || null;

	const { tiers, hasRequiredPlan } = detail;

	// Default to 100 requests if the site is not registered/connected.
	const nextTierValue = isRegistered ? nextTier?.value : 100;
	// Decide the quantity value for the upgrade, but ignore the unlimited tier.
	const quantity = nextTierValue !== 1 ? nextTierValue : null;

	// Highlight the last feature in the table for all the tiers except the unlimited one.
	const highlightLastFeature = nextTier?.value !== 1;

	return tiers && tiers.length ? (
		<AdminPage showHeader={ false } showBackground={ false }>
			<Container horizontalSpacing={ 3 } horizontalGap={ 3 }>
				<Col className={ styles[ 'product-interstitial__product-header' ] }>
					<JetpackLogo />
					<div className={ styles[ 'product-interstitial__product-header-name' ] }>
						AI Assistant
					</div>
				</Col>
				<Col className={ styles[ 'product-interstitial__header' ] }>
					<GoBackLink onClick={ onClickGoBack } />
				</Col>
				<Col>
					<AiTierDetailTable />
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
