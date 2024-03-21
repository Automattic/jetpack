/**
 * External dependencies
 */
import { useConnection } from '@automattic/jetpack-connection';
import debugFactory from 'debug';
import { useCallback } from 'react';
/**
 * Internal dependencies
 */
import ProductInterstitial from '../';
import useProduct from '../../../data/products/use-product';
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
	debug( detail );

	const { userConnectionData } = useConnection();
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

	return (
		<ProductInterstitial
			slug="jetpack-ai"
			installsPlugin={ true }
			imageContainerClassName={ styles.aiImageContainer }
			hideTOS={ true }
			directCheckout={ false }
			ctaCallback={ ctaClickHandler }
		>
			<img src={ jetpackAiImage } alt="Search" />
		</ProductInterstitial>
	);
}
