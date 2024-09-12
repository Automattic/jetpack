/**
 * External dependencies
 */
import { Button } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import debugFactory from 'debug';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import ProductInterstitial from '../';
import useProduct from '../../../data/products/use-product';
import useMyJetpackConnection from '../../../hooks/use-my-jetpack-connection';
import jetpackAiImage from '../jetpack-ai.png';
import styles from './style.module.scss';

const debug = debugFactory( 'my-jetpack:product-interstitial:jetpack-ai' );
/**
 * JetpackAiInterstitial component
 *
 * @return {object} JetpackAiInterstitial react component.
 */
export default function JetpackAiInterstitial() {
	const slug = 'jetpack-ai';
	const { detail } = useProduct( slug );
	debug( detail );

	const tierPlansEnabled = detail?.aiAssistantFeature?.tierPlansEnabled || false;

	const { userConnectionData } = useMyJetpackConnection();
	const { currentUser } = userConnectionData;
	const { wpcomUser } = currentUser;
	const userId = currentUser?.id || 0;
	const blogId = currentUser?.blogId || 0;
	const wpcomUserId = wpcomUser?.ID || 0;
	const userOptKey = `jetpack_ai_optfree_${ userId }_${ blogId }_${ wpcomUserId }`;

	const ctaClickHandler = useCallback(
		( { tier } ) => {
			tier === 'free' && localStorage.setItem( userOptKey, true );
		},
		[ userOptKey ]
	);

	const fairUsageSupportingInfo = createInterpolateElement(
		__(
			'* Limits apply for high request capacity. <link>Learn more about it here</link>.',
			'jetpack-my-jetpack'
		),
		{
			link: (
				<Button
					href="https://jetpack.com/redirect/?source=ai-assistant-fair-usage-policy"
					variant="link"
					weight="regular"
					size="small"
					target="_blank"
				/>
			),
		}
	);

	return (
		<ProductInterstitial
			slug="jetpack-ai"
			installsPlugin={ true } // this here just to trigger the ctaCallback
			imageContainerClassName={ styles.aiImageContainer }
			hideTOS={ true }
			directCheckout={ false }
			ctaCallback={ ctaClickHandler }
			ctaButtonLabel={ __( 'Upgrade', 'jetpack-my-jetpack' ) }
			supportingInfo={ ! tierPlansEnabled ? fairUsageSupportingInfo : null }
		>
			<img src={ jetpackAiImage } alt="Jetpack AI" />
		</ProductInterstitial>
	);
}
