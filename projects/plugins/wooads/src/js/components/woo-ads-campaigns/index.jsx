/**
 * External dependencies
 */
import React, { useEffect, useState, useCallback } from 'react';
import moment from 'moment-timezone';
import classNames from 'classnames';
import { ToggleControl } from '@wordpress/components';
import { Container, Col, SplitButton, Text, H3 } from '@automattic/jetpack-components';
import { getCurrencyObject } from '@automattic/format-currency';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import * as api from '../../utils';
import { WooAdsRequireOptIn } from '../woo-ads-require-optin';
import styles from '../admin-page/styles.module.scss';
import { Loading } from '../loading';

const { blogId } = window.wooAdsInitialState;

// copied from jetpack-product-card
const formatPrice = ( price, currencyCode, isOldPrice = false ) => {
	const priceObject = getCurrencyObject( price, currencyCode );
	const classes = classNames( {
		'jp-product-card__raw-price': true,
		'jp-product-card__raw-price--is-old-price': isOldPrice,
	} );

	return (
		<div className={ classes }>
			<sup className="jp-product-card__currency-symbol">{ priceObject.symbol }</sup>
			<span className="jp-product-card__price-integer">{ priceObject.integer }</span>
			<sup className="jp-product-card__price-fraction">{ priceObject.fraction }</sup>
		</div>
	);
};

export const WooAdsCampaigns = () => {
	const [ isBlogOptedIn, setIsBlogOptedIn ] = useState( false );
	const [ userCampaigns, setUserCampaigns ] = useState( [] );
	const [ loading, setLoading ] = useState( false );

	useEffect( () => {
		const isOptedIn = api.isBlogOptInWooAds();
		setIsBlogOptedIn( isOptedIn );
		if ( isOptedIn ) {
			const campaigns = api.getWooAdsUserCampaigns();
			setUserCampaigns( campaigns );
			setIsBlogOptedIn( true ); // fake
		}
		setLoading( false );
	}, [] );

	const campaignControls = [
		{ title: __( 'Check vitals', 'wooads' ), onClick: () => {} },
		{ title: __( 'Cancel campaign', 'wooads' ), onClick: () => {} },
	];

	const handleSetAutoRenewCampaign = useCallback(
		setActive => api.setAutoRenewCampaign( blogId, setActive ),
		[]
	);

	if ( loading ) {
		return (
			<Container horizontalSpacing={ 5 }>
				<Loading />
			</Container>
		);
	}

	return isBlogOptedIn ? (
		<Container horizontalSpacing={ 5 }>
			<Col lg={ 12 } md={ 8 } sm={ 4 }>
				<div className={ styles[ 'jp-wooads-campaign-wrapper' ] }>
					<h2 className={ styles.H2 }>{ __( 'Active WooAds Campaigns', 'wooads' ) }</h2>
					{ userCampaigns.length ? (
						userCampaigns.map( campaign => {
							const {
								status = 'unknown',
								startDate,
								endDate,
								impressions,
								targetImpressions,
								autoRenew,
								earned,
							} = campaign;
							return (
								<Container
									className={ `${ styles.box } ${ styles.campaign } ${
										styles[ `wrapper-status_${ status }` ]
									}` }
									horizontalSpacing={ 4 }
								>
									<Col lg={ 3 } md={ 3 } sm={ 3 }>
										<H3>{ __( 'Campaign', 'wooads' ) }</H3>{ ' ' }
										<Text variant="body-small">
											{ __( 'Starts on', 'wooads' ) }:{ ' ' }
											<span className={ styles.campaignDate }>
												{ moment( startDate ).format( 'MMMM Do YYYY' ) }
											</span>
										</Text>
										<Text variant="body-small">
											{ __( 'Ends on', 'wooads' ) }:{ ' ' }
											<span className={ styles.campaignDate }>
												{ moment( endDate ).format( 'MMMM Do YYYY' ) }
											</span>
										</Text>
									</Col>

									<Col lg={ 3 } md={ 3 } sm={ 3 }>
										<H3>{ __( 'Impressions', 'wooads' ) }</H3>{ ' ' }
										<span className={ styles.impressions }>{ impressions }</span> /{ ' ' }
										{ targetImpressions === 0 ? __( 'No limit', 'wooads' ) : targetImpressions }
									</Col>

									<Col lg={ 2 } md={ 2 } sm={ 2 }>
										{ status !== 'scheduled' && (
											<>
												<H3>{ __( 'Earnings', 'wooads' ) }</H3>
												<Text className={ styles.earnings }>{ formatPrice( earned, 'USD' ) }</Text>
											</>
										) }
									</Col>

									<Col lg={ 2 } md={ 2 } sm={ 2 }>
										<H3>{ __( 'Auto-renew', 'wooads' ) }</H3>
										<ToggleControl
											disabled={ status === 'expired' }
											checked={ autoRenew }
											onChange={ handleSetAutoRenewCampaign }
										/>
									</Col>

									<Col lg={ 2 } md={ 2 } sm={ 2 }>
										<H3>
											{ __( 'Status:', 'wooads' ) }:
											<span
												className={ `${ styles[ 'campaign-status' ] } ${
													styles[ `campaign-status_${ status }` ]
												}` }
											>
												{ ` ${ status }` }
											</span>
										</H3>
										<SplitButton
											mt={ 3 }
											pt={ 3 }
											variant={ 'secondary' }
											controls={ campaignControls }
										>
											{ __( 'Configure:', 'wooads' ) }
										</SplitButton>
									</Col>
								</Container>
							);
						} )
					) : (
						<Container className={ styles.box } horizontalSpacing={ 12 }>
							<Col lg={ 12 } md={ 12 } sm={ 12 }>
								<Text>{ __( 'Currently, you cannot create WooAds Campaigns', 'wooads' ) }</Text>
							</Col>
						</Container>
					) }
				</div>
			</Col>
		</Container>
	) : (
		<WooAdsRequireOptIn />
	);
};
