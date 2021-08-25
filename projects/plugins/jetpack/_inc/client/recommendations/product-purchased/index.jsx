/**
 * External dependencies
 */
import React, { useEffect } from 'react';
import { connect } from 'react-redux';
import { __ } from '@wordpress/i18n';
import { ProgressBar } from '@automattic/components';

/**
 * Internal dependencies
 */
import { PromptLayout } from '../prompts/prompt-layout';
import Button from 'components/button';
import Gridicon from 'components/gridicon';
import analytics from 'lib/analytics';
import { PLAN_JETPACK_BACKUP_DAILY, PLAN_JETPACK_SECURITY_DAILY } from 'lib/plans/constants';
import { getNextRoute, getDataByKey } from 'state/recommendations';

/**
 * Style dependencies
 */
import './style.scss';

const features = {
	[ PLAN_JETPACK_BACKUP_DAILY ]: [
		__( 'Automated daily off-site backups', 'jetpack' ),
		__( 'One-click restores', 'jetpack' ),
		__( 'Unlimited secure storage', 'jetpack' ),
	],
	[ PLAN_JETPACK_SECURITY_DAILY ]: [
		__( 'Automated daily off-site backups', 'jetpack' ),
		__( 'One-click restores', 'jetpack' ),
		__( 'Unlimited secure storage', 'jetpack' ),
		__( 'Automated daily scanning', 'jetpack' ),
		__( 'Comment and form spam protection', 'jetpack' ),
	],
};

const ProductPurchasedComponent = props => {
	const { nextRoute, purchasedProductSlug } = props;

	useEffect( () => {
		analytics.tracks.recordEvent( 'jetpack_recommendations_product_purchased', {
			type: purchasedProductSlug,
		} );
	}, [ purchasedProductSlug ] );

	const answerSection = (
		<div className="jp-recommendations-product-purchased">
			<ul className="jp-recommendations-product-purchased__features">
				{ features[ purchasedProductSlug ].map( feature => (
					<li className="jp-recommendations-product-purchased__feature" key={ feature }>
						<Gridicon icon="checkmark" />
						{ feature }
					</li>
				) ) }
			</ul>
			<Button primary className="jp-recommendations-product-purchased__next" href={ nextRoute }>
				{ __( 'Configure your site', 'jetpack' ) }
			</Button>
		</div>
	);

	return (
		<PromptLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '33' } /> }
			question={ __( 'Your plan has been upgraded!', 'jetpack' ) }
			description={ __( 'You now have access to these benefits:', 'jetpack' ) }
			illustrationPath={ 'recommendations/product-purchased-illustration.svg' }
			answer={ answerSection }
		/>
	);
};

export const ProductPurchased = connect( state => ( {
	nextRoute: getNextRoute( state ),
	purchasedProductSlug: getDataByKey( state, 'product-suggestion-selection' ),
} ) )( ProductPurchasedComponent );
