/**
 * External dependencies
 */
import { ProgressBar } from '@automattic/components';
import { __ } from '@wordpress/i18n';
import React, { useCallback, useEffect, useState } from 'react';
import { connect } from 'react-redux';
import restApi from 'rest-api';

/**
 * Internal dependencies
 */
import { QuestionLayout } from '../layout';
import { jetpackCreateInterpolateElement } from 'components/create-interpolate-element';
import ExternalLink from 'components/external-link';
import InstallButton from 'components/install-button';
import { imagePath } from 'constants/urls';
import { updateRecommendationsStep } from 'state/recommendations';
import { fetchPluginsData, isPluginActive } from 'state/site/plugins';

const WooCommerceQuestionComponent = props => {
	const [ isInstalling, setIsInstalling ] = useState( false );

	// TODO: effect that checks if plugin is active and forwards if so.

	useEffect( () => {
		props.updateRecommendationsStep( 'woocommerce' );
	} );

	const onInstallClick = useCallback( () => {
		props.installWooCommerceAndNavigate( setIsInstalling, [ setIsInstalling ] );
	} );

	// TODO: set the href link on "Decide later"

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
					<InstallButton primary onClick={ onInstallClick } isInstalling={ isInstalling }>
						{ __( 'Install WooCommerce' ) }
					</InstallButton>
					<a href="">{ __( 'Decide later' ) }</a>
				</div>
			}
			illustration={
				<img
					className="jp-recommendations-question__illustration"
					src={ imagePath + '/recommendations/woocommerce-illustration.png' }
					alt=""
				/>
			}
		/>
	);
};

const WooCommerceQuestion = connect(
	state => ( {} ),
	dispatch => ( {
		updateRecommendationsStep: step => dispatch( updateRecommendationsStep( step ) ),
		installWooCommerceAndNavigate: setIsInstalling => {
			setIsInstalling( true );
			restApi.installPlugin( 'woocommerce', 'recommendations' ).then( () => {
				setIsInstalling( false );
				dispatch( fetchPluginsData() );
				// TODO: navigate
			} );
		},
	} )
)( WooCommerceQuestionComponent );

export { WooCommerceQuestion };
