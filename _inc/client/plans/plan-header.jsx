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
							{ __( 'Introducing our most affordable backups and security plan yet' ) }
						</h2>
						<p className="jp-landing-plans__header-description">
							{ __( 'The Personal Plan keeps your data, site, and hard work safe.' ) }
						</p>
						<div className="jp-landing-plans__header-img-container">
							<div className="jp-landing-plans__header-col-left">
								<h3 className="jp-landing-plans__header-subtitle">{ __( "How much is your website worth?" ) }</h3>
								<p className="jp-landing-plans__header-text">
									{ __( "For less than the price of a coffee a month you can rest easy knowing your hard work (or livelihood) is backed up." ) }
									<br /><br />
									{ __( "Hackers, botnets and spammers attack websites indiscriminately. Their goal is to attack everywhere and often. Our goal is to help you prepare by blocking these threats, and in worst-case-scenarios we'll be here to help you restore your site to its former glory." ) }
								</p>
								<p className="jp-landing-plans__header-btn-container">
									<Button href={ 'https://jetpack.com/redirect/?source=plans-main-top&site=' + this.props.siteRawUrl } className="is-primary">
										{ __( 'Learn more' ) }
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
							<img src={ imagePath + '/plans/plan-jetpack-free.svg' } className="jp-landing__plan-icon" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Your site is on the Free Jetpack Plan' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'Upgrade to a paid plan to unlock world-class security, spam protection tools, priority support, SEO and monetization tools.' ) }</p>
						</div>
					</div>
				);
				break;

			case 'jetpack_personal':
			case 'jetpack_personal_monthly':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/plan-jetpack-premium.svg' } className="jp-landing__plan-icon" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Your site is on the Jetpack Personal plan' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'With this plan you are provided with spam-protection, daily backups (up to 30 days), and unlimited storage.' ) }</p>
						</div>
					</div>
				);
			break;

			case 'jetpack_premium':
			case 'jetpack_premium_monthly':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/plan-jetpack-premium.svg' } className="jp-landing__plan-icon" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Your site is on the Jetpack Premium plan' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'With this plan you are provided with spam-protection, daily backups (up to 30 days), unlimited backup storage, security scanning, 13Gb of ad-free video hosting, income generation from ads, and priority support.' ) }</p>
						</div>
					</div>
				);
				break;

			case 'jetpack_business':
			case 'jetpack_business_monthly':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/plan-jetpack-pro.svg' } className="jp-landing__plan-icon" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Your site is on the Jetpack Professional plan' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'You get spam-protection, real-time backups (unlimited archive), unlimited backup storage, security scanning, unlimited ad-free video hosting, income generation from ads, SEO tools, and priority support.' ) }</p>
						</div>
					</div>
				);
				break;

			case 'dev':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img src={ imagePath + '/plans/plan-jetpack-free.svg' } className="jp-landing__plan-icon" />
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">{ __( 'Your site is on Development Mode' ) }</h3>
							<p className="jp-landing__plan-features-text">{ __( 'Once you connect, you can upgrade to a paid plan in order to unlock world-class security, spam protection tools, and priority support.' ) }</p>
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
