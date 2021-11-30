/**
 * External dependencies
 */
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { createInterpolateElement } from '@wordpress/element';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Button from 'components/button';
import Card from 'components/card';
import bundleImageUrl from './shield-with-check.svg';
import cloudImageUrl from './cloud.svg';
import shieldImageUrl from './shield.svg';
import removeBugImageUrl from './remove-bug.svg';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import { hasActiveSecurityPurchase as getHasActiveSecurityPurchase } from 'state/site';

/**
 * Style dependencies
 */
import './style.scss'

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
				imageUrl: cloudImageUrl,
				text: __( 'Backup', 'jetpack' )
			},
			{
				id: 'scan',
				imageUrl: shieldImageUrl,
				text: __( 'Scan', 'jetpack' )
			},
			{
				id: 'antispam',
				imageUrl: removeBugImageUrl,
				text: __( 'Anti-spam', 'jetpack' )
			},
		];

		return (
			<div className="dash-security-bundle--content-info-features">
				{
					features.map( ( { id, imageUrl, text } ) => (
						<div id={ id } className="dash-security-bundle--content-info-features-single-feature" >
							<img src={ imageUrl } />
							<p>{ text }</p>
						</div>
					) )
				}
			</div>
		);
	}

	render() {
		const { hasActiveSecurityPurchase } = this.props;

		if ( hasActiveSecurityPurchase ) {
			return null;
		}

		return ( 
			<Card className="dash-security-bundle" >
				<div className="dash-security-bundle--icon" >
					<img src={ bundleImageUrl } />
				</div>
				<div className="dash-security-bundle--content" >
					<div className="dash-security-bundle--content-info" >
						<h2>{ __( 'Comprehensive Site Security', 'jetpack' ) }</h2>
						
						<p>
							{ createInterpolateElement(
								__(
									'Total protection for your site, including Backup, Scan, and Anti-spam. <a>Learn More.</a>',
									'jetpack'
								),
								{
									a: (
										<a
											href={ getRedirectUrl( 'jetpack-features-security' ) }
											rel="noopener noreferrer"
											target="_blank"
										></a>
									),
								}
							) }
						</p>
						{ this.renderFeatures() }
					</div>
					<div className="dash-security-bundle--content-cta" >
						<Button 
							className="dash-security-bundle--content-cta-button"
							href={ this.props.productDescriptionUrl }
							onClick={ this.trackUpgradeClick }
							compact
							primary
						>
							{ __( 'Upgrade', 'jetpack' ) }
						</Button>
					</div>
				</div>
			</Card>
		);
	}
}



export default connect(
	state => ( { 
		productDescriptionUrl:  getProductDescriptionUrl( state, 'security' ), 
		hasActiveSecurityPurchase: getHasActiveSecurityPurchase( state ),
	} )
)( DashSecurityBundle );
