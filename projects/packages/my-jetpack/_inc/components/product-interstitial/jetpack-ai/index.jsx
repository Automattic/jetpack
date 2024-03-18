/**
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
import debugFactory from 'debug';
/**
 * Internal dependencies
 */
import ProductInterstitial from '../';
import useProduct from '../../../data/products/use-product';
import { useGoBack } from '../../../hooks/use-go-back';
import jetpackAiImage from '../jetpack-ai.png';
import { JetpackAIInterstitialMoreRequests } from './more-requests';
import styles from './style.module.scss';

const debug = debugFactory( 'my-jetpack:jetpack-ai-interstitial' );
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
	const nextTier = detail?.aiAssistantFeature?.nextTier || null;

	const { hasRequiredPlan } = detail;

	// The user has a plan and there is not a next tier
	if ( isRegistered && hasRequiredPlan && ! nextTier ) {
		debug( 'user is on top tier' );
		// TODO: handle this on the pricing table and the product page
		return <JetpackAIInterstitialMoreRequests onClickGoBack={ onClickGoBack } />;
	}

	// Default to 100 requests if the site is not registered/connected.
	const nextTierValue = isRegistered ? nextTier?.value : 100;
	// Decide the quantity value for the upgrade, but ignore the unlimited tier.
	const quantity = nextTierValue !== 1 ? nextTierValue : null;

	// Highlight the last feature in the table for all the tiers except the unlimited one.
	const highlightLastFeature = nextTier?.value !== 1;

	return (
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
