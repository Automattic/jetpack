/**
 * External dependencies
 */
import { ProgressBar } from '@automattic/components';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { QuestionLayout } from '../layout';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import ExternalLink from 'components/external-link';
import Button from 'components/button';
import restApi from 'rest-api';
import { getNextRoute, updateRecommendationsStep } from 'state/recommendations';
import { fetchPluginsData } from 'state/site/plugins';

const WooCommerceQuestionComponent = props => {
	const { nextRoute } = props;

	useEffect( () => {
		props.updateRecommendationsStep( 'woocommerce' );
	} );

	const onInstallClick = useCallback( () => {
		props.installWooCommerceAndReloadPluginsData();
	} );

	return (
		<QuestionLayout
			progressBar={ <ProgressBar color={ '#00A32A' } value={ '33' } /> }
			question={ __( 'Would you like WooCommerce to power your store?', 'jetpack' ) }
			description={ jetpackCreateInterpolateElement(
				__(
					'We’re partnered with <strong>WooCommerce</strong> — a customizable, open-source eCommerce platform built for WordPress. It’s everything you need to start selling products today. <ExternalLink>Learn more</ExternalLink>',
					'jetpack'
				),
				{
					strong: <strong />,
					ExternalLink: (
						<ExternalLink
							href="https://woocommerce.com/woocommerce-features/"
							target="_blank"
							icon={ true }
							iconSize={ 16 }
						/>
					),
				}
			) }
			answer={
				<div className="jp-recommendations-question__install-section">
					<Button primary href={ nextRoute } onClick={ onInstallClick }>
						{ __( 'Install WooCommerce' ) }
					</Button>
					<a href={ nextRoute }>{ __( 'Decide later' ) }</a>
				</div>
			}
			illustrationPath="/recommendations/woocommerce-illustration.png"
		/>
	);
};

const WooCommerceQuestion = connect(
	state => ( { nextRoute: getNextRoute( state ) } ),
	dispatch => ( {
		installWooCommerceAndReloadPluginsData: () => {
			restApi.installPlugin( 'woocommerce', 'recommendations' ).then( () => {
				dispatch( fetchPluginsData() );
			} );
		},
		updateRecommendationsStep: step => dispatch( updateRecommendationsStep( step ) ),
	} )
)( WooCommerceQuestionComponent );

export { WooCommerceQuestion };
