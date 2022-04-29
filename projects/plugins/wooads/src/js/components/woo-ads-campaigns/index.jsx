/**
 * External dependencies
 */
import React, { useEffect, useState } from 'react';
import { Container, Col, SplitButton, Text, H3 } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

/**
 * Internal dependencies
 */
import * as api from '../../utils';
import { WooAdsRequireOptIn } from '../woo-ads-require-optin';
import styles from '../admin-page/styles.module.scss';
import { Loading } from '../loading';

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
							const { name, description, activeInsertions, inactiveInsertions } = campaign;
							const status = activeInsertions > 0 ? 'active' : 'expired';
							return (
								<Container
									className={ `${ styles.box } ${ styles.campaign } ${
										styles[ `wrapper-status_${ status }` ]
									}` }
									horizontalSpacing={ 4 }
								>
									<Col lg={ 4 } md={ 4 } sm={ 4 }>
										<H3>{ __( 'Campaign', 'wooads' ) }</H3>
										<Text>{ name }</Text>
										<Text variant="body-small">{ description }</Text>
									</Col>

									<Col lg={ 4 } md={ 4 } sm={ 4 }>
										<H3>{ __( 'Insertions', 'wooads' ) }</H3>
										<Text variant="body-small">
											{ __( 'Active', 'wooads' ) }:{ ' ' }
											<span className={ styles[ 'active-impressions' ] }>{ activeInsertions }</span>
										</Text>
										<Text variant="body-small">
											{ __( 'Inactive', 'wooads' ) }:{ ' ' }
											<span className={ styles[ 'inactive-impressions' ] }>
												{ inactiveInsertions }
											</span>
										</Text>
									</Col>

									<Col lg={ 4 } md={ 4 } sm={ 4 }>
										<H3>
											{ __( 'Status', 'wooads' ) }:
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
