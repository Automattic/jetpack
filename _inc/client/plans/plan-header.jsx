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

const PlanHeader = React.createClass( {
	render() {
		let starrySky = '',
			planCard = '';
		switch ( this.props.plan ) {
			case 'jetpack_free':
				starrySky = (
					<div className="jp-landing-plans__header">
						<h2 className="jp-landing-plans__header-title">
							{ __( 'Powerful security tools for ultimate peace of mind' ) }
						</h2>
						<p className="jp-landing-plans__header-description">
							{ __( 'Backup, protect, repair and build a better website.' ) }
						</p>
						<div className="jp-landing-plans__header-img-container">
							<div className="jp-landing-plans__header-col-left">
								<h3 className="jp-landing-plans__header-subtitle">{ __( "Threats don't discriminate" ) }</h3>
								<p className="jp-landing-plans__header-text">{ __( "Hackers, botnets and spammers attack websites indiscriminately. Their goal is to attack everywhere and often. Our goal is to help you prepare by blocking these threats, and in worst-case-scenarios we'll be here to help you restore your site to its former glory." ) }</p>
								<p className="jp-landing-plans__header-btn-container">
									<Button href={ 'https://wordpress.com/plans/' + window.Initial_State.rawUrl } className="is-primary">
										{ __( 'Compare Plans' ) }
									</Button>
								</p>
							</div>
							<div className="jp-landing-plans__header-col-right">
								<img src={ imagePath + '/plans/admin-lock2x.png' } className="jp-landing-plans__header-img" />
							</div>
						</div>
						<div className="jp-landing-plans__clouds jp-clouds-top">
							<img src={ imagePath + '/white-clouds.svg' } />
						</div>
					</div>
				);
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/free-plan-icon.jpg' } className="jp-landing__plan-icon" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Your site is on the Free Jetpack Plan' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'Upgrade to Premium or Pro in order to unlock world class security, spam protection tools, and priority support.' ) }</p>
						</div>
					</div>
				);
				break;

			case 'jetpack_premium':
			case 'jetpack_premium_monthly':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/premium-plan-icon.jpg' } className="jp-landing__plan-icon" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Your site is on the Jetpack Premium plan' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'Unlock the full potential of your site with the features included in your plan.' ) }</p>
						</div>
					</div>
				);
				break;

			case 'jetpack_business':
			case 'jetpack_business_monthly':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/pro-plan-icon.jpg' } className="jp-landing__plan-icon" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Your site is on the Jetpack Professional plan' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'Unlock the full potential of your site with the features included in your plan.' ) }</p>
						</div>
					</div>
				);
				break;

			case 'dev':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/free-plan-icon.jpg' } className="jp-landing__plan-icon" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Your site is on Development Mode' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'Once you connect, you can upgrade to Premium or Pro in order to unlock worldclass security, spam protection tools, and priority support.' ) }</p>
						</div>
					</div>
				);
				break;

			default:
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img is-placeholder">
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title is-placeholder"> </h3>
							<p className="jp-landing__plan-features-text is-placeholder"> </p>
						</div>
					</div>
				);
				break;
		}
		return (
			<div>
				{ starrySky }
				{ planCard	}
			</div>
		);
	}
} );

export default PlanHeader;
