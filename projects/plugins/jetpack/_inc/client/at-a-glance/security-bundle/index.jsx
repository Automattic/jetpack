import { getRedirectUrl, getIconBySlug } from '@automattic/jetpack-components';
import { ExternalLink } from '@wordpress/components';
import { createInterpolateElement } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import Button from 'components/button';
import Card from 'components/card';
import analytics from 'lib/analytics';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import {
	isFetchingSitePurchases as getIsFetchingSitePurchases,
	hasActiveSecurityPurchase as getHasActiveSecurityPurchase,
} from 'state/site';
import bundleImageUrl from './shield-with-check.svg';

import './style.scss';

class DashSecurityBundle extends Component {
	trackUpgradeClick = () => {
		analytics.tracks.recordJetpackClick( {
			page: 'aag',
			target: 'upgrade-button',
			feature: 'security',
		} );
	};

	renderFeatures() {
		const features = [
			{
				id: 'backup',
				text: _x(
					'VaultPress Backup',
					'The Jetpack VaultPress Backup product name, without the Jetpack prefix',
					'jetpack'
				),
			},
			{
				id: 'scan',
				text: _x( 'Scan', 'The Jetpack Scan product name, without the Jetpack prefix', 'jetpack' ),
			},
			{
				id: 'anti-spam',
				text: __( 'Akismet Anti-spam', 'jetpack' ),
			},
		];

		return (
			<div className="dash-security-bundle--content-info-features">
				{ features.map( ( { id, text } ) => {
					const Icon = getIconBySlug( id );

					return (
						<div
							key={ id }
							id={ id }
							className="dash-security-bundle--content-info-features-single-feature"
						>
							<Icon size={ 16 } />
							<p>{ text }</p>
						</div>
					);
				} ) }
			</div>
		);
	}

	render() {
		const { hasActiveSecurityPurchase, isFetchingSitePurchases } = this.props;

		if ( hasActiveSecurityPurchase || isFetchingSitePurchases ) {
			return null;
		}

		return (
			<Card className="dash-security-bundle">
				<div className="dash-security-bundle--icon">
					<img
						src={ bundleImageUrl }
						alt={ __(
							'A shield and check mark representing the Jetpack Security Bundle',
							'jetpack'
						) }
					/>
				</div>
				<div className="dash-security-bundle--content">
					<div className="dash-security-bundle--content-info">
						<h3>{ __( 'Comprehensive Site Security', 'jetpack' ) }</h3>

						<p>
							{ createInterpolateElement(
								__(
									'Total protection for your site, including VaultPress Backup, Scan, and Akismet Anti-spam. <ExternalLink>Learn More</ExternalLink>',
									'jetpack'
								),
								{
									ExternalLink: (
										<ExternalLink
											href={ getRedirectUrl( 'jetpack-features-security' ) }
											rel="noopener noreferrer"
											target="_blank"
										></ExternalLink>
									),
								}
							) }
						</p>
						{ this.renderFeatures() }
					</div>
					<div className="dash-security-bundle--content-cta">
						<Button
							className="dash-security-bundle--content-cta-button"
							href={ this.props.productDescriptionUrl }
							onClick={ this.trackUpgradeClick }
							compact
							primary
						>
							{ _x( 'Upgrade', 'Call to action to buy a new plan', 'jetpack' ) }
						</Button>
					</div>
				</div>
			</Card>
		);
	}
}

export default connect( state => ( {
	hasActiveSecurityPurchase: getHasActiveSecurityPurchase( state ),
	isFetchingSitePurchases: getIsFetchingSitePurchases( state ),
	productDescriptionUrl: getProductDescriptionUrl( state, 'security' ),
} ) )( DashSecurityBundle );
