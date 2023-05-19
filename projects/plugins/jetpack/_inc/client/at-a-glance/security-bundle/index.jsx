import { getRedirectUrl } from '@automattic/jetpack-components';
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
import Gridicon from '../../components/gridicon';
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
									'Total protection for your site, including<br /> VaultPress Backup, Scan, and Akismet Anti-spam.',
									'jetpack'
								),
								{
									br: <br />,
								}
							) }
						</p>
					</div>
					<div className="dash-security-bundle--content-cta">
						<Button
							className="dash-security-bundle--content-cta-button"
							href={ this.props.productDescriptionUrl }
							onClick={ this.trackUpgradeClick }
							primary
						>
							{ _x( 'Upgrade', 'Call to action to buy a new plan', 'jetpack' ) }
						</Button>

						<Button
							className="dash-security-bundle--content-cta-button"
							href={ getRedirectUrl( 'jetpack-features-security' ) }
							rel="noopener noreferrer"
							target="_blank"
						>
							{ _x( 'Learn more', 'Learn more about the new plan', 'jetpack' ) }
							<Gridicon className="dops-card__link-indicator" icon="external" />
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
