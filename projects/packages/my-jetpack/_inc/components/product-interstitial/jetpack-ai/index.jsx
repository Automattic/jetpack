/**
 * External dependencies
 */
import { AdminPage, Col, Container, JetpackLogo } from '@automattic/jetpack-components';
import { useConnection } from '@automattic/jetpack-connection';
import { __ } from '@wordpress/i18n';
import classnames from 'classnames';
import debugFactory from 'debug';
import { useCallback } from 'react';
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
	debug( detail );

	const { onClickGoBack } = useGoBack( { slug } );
	const { userConnectionData } = useConnection();
	const { currentUser } = userConnectionData;
	const { wpcomUser } = currentUser;
	const userId = currentUser?.id || 0;
	const blogId = currentUser?.blogId || 0;
	const wpcomUserId = wpcomUser?.ID || 0;
	const userOptKey = `jetpack_ai_optfree_${ userId }_${ blogId }_${ wpcomUserId }`;

	const { tiers } = detail;

	const ctaClickHandler = useCallback(
		( { tier } ) => {
			tier === 'free' && localStorage.setItem( userOptKey, true );
		},
		[ userOptKey ]
	);

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
			directCheckout={ false }
			ctaCallback={ ctaClickHandler }
		>
			<img src={ jetpackAiImage } alt="Search" />
		</ProductInterstitial>
	);
}
