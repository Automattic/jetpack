/**
 * External dependencies
 */
import React from 'react';
import Button from 'components/button';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants';

const PlanBody = React.createClass( {
	render() {
		let planCard = '';
		switch ( this.props.plan ) {
			case 'jetpack_premium':
			case 'jetpack_premium_monthly':
			case 'jetpack_business':
			case 'jetpack_business_monthly':
				let needMore = '';
				if ( [ 'jetpack_premium', 'jetpack_premium_monthly' ].includes( this.props.plan ) ) {
					needMore = (
						<div className="jp-jetpack-landing__plan-features-card">
							<h3>{ __( 'Need more?' ) }</h3>
							<p>{ __( 'Jetpack Professional offers more features.' ) }</p>
							<p>
								<Button href={ 'https://wordpress.com/plans/compare/' + window.Initial_State.rawUrl }>
									{ __( 'Compare Plans' ) }
								</Button>
								<Button href={ 'https://wordpress.com/plans/' + window.Initial_State.rawUrl } className="is-primary">
									{ __( 'Upgrade to Professional' ) }
								</Button>
							</p>
						</div>
					)
				}
				planCard = (
					<div className="jp-jetpack-landing__plan-features">
						<div className="jp-jetpack-landing__plan-features-card">
							<h3>{ __( 'Jetpack Anti-spam' ) }</h3>
							<p>{ __( 'Bulletproof spam filtering help maintain peace of mind while you build and grow your site.' ) }</p>
							<Button href={ window.Initial_State.adminUrl + 'admin.php?page=akismet-key-config' } className="is-primary">
								{ __( 'View your spam stats' ) }
							</Button>
						</div>

						<div className="jp-jetpack-landing__plan-features-card">
							<h3>{ __( 'Jetpack Security Scanning & Backups' ) }</h3>
							<p>{ __( 'Realtime backup with unlimited space, one-click restores, bulletproof spam monitoring, malware defense, and brute-force login protection - all in one place.' ) }</p>
							<Button href={ 'https://wordpress.com/settings/security/' + window.Initial_State.rawUrl } className="is-primary">
								{ __( 'View your security dashboard' ) }
							</Button>
						</div>
						{ needMore }
					</div>
				);
				break;

			case 'jetpack_free':
			case 'dev':
				planCard = (
					<div className="jp-jetpack-landing__plan-features">
						<h3>{ __( 'Maximum grade security' ) }</h3>
						<p>{ __( 'Realtime backup with unlimited space, one-click restores, bulletproof spam monitoring, malware defense and brute-force login protection - all in one place and optimized for WordPress.' ) }</p>

						<h3>{ __( 'Lock out the bad guys' ) }</h3>
						<p>{ __( 'Bulletproof spam filtering protects your brand, your readers, and improves SEO. Brute force login protection helps maintain peace of mind and keeps your back end safe from intruders.' ) }</p>

						<h3>{ __( 'Enjoy priority support' ) }</h3>
						<p>{ __( 'Need help? A Happiness Engineer can answer questions about your site, your account or how to do about anything.' ) }</p>
					</div>
				);
				break;
		}
		return (
			<div>
				{ planCard	}
			</div>
		);
	}
} );

export default PlanBody;
