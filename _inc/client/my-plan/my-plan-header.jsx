/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import analytics from 'lib/analytics';
import { getPlanClass } from 'lib/plans/constants';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import { imagePath } from 'constants/urls';
import { getUpgradeUrl, showBackups } from 'state/initial-state';

class MyPlanHeader extends React.Component {
	trackLearnMore = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'learn-more',
			plan: 'free',
			page: 'plans',
		} );
	};

	render() {
		let planCard = '';
		switch ( getPlanClass( this.props.plan ) ) {
			case 'is-free-plan':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img
								src={ imagePath + '/plans/plan-free.svg' }
								className="jp-landing__plan-icon"
								alt={ __( 'Jetpack Free Plan' ) }
							/>
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">
								{ __( 'Welcome to Jetpack Free' ) }
							</h3>
							<p className="jp-landing__plan-features-text">
								{ __( 'Get started with hassle-free design, stats, and performance tools.' ) }
							</p>
						</div>
					</div>
				);
				break;

			case 'is-personal-plan':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img
								src={ imagePath + '/plans/plan-personal.svg' }
								className="jp-landing__plan-icon"
								alt={ __( 'Jetpack Personal Plan' ) }
							/>
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">
								{ __( 'Welcome to Jetpack Personal' ) }
							</h3>
							{ this.props.showBackups ? (
								<p className="jp-landing__plan-features-text">
									{ __( 'Daily backups, spam filtering, and priority support.' ) }
								</p>
							) : (
								<p className="jp-landing__plan-features-text">
									{ __( 'Spam filtering and priority support.' ) }
								</p>
							) }
						</div>
					</div>
				);
				break;

			case 'is-premium-plan':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img
								src={ imagePath + '/plans/plan-premium.svg' }
								className="jp-landing__plan-icon"
								alt={ __( 'Jetpack Premium Plan' ) }
							/>
						</div>
						<div className="jp-landing__plan-iconcard-current">
							<h3 className="jp-landing__plan-features-title">
								{ __( 'Welcome to Jetpack Premium' ) }
							</h3>
							<p className="jp-landing__plan-features-text">
								{ __(
									'Full security suite, marketing and revenue automation tools, unlimited video hosting, and priority support.'
								) }
							</p>
						</div>
					</div>
				);
				break;

			case 'is-business-plan':
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img">
							<img
								src={ imagePath + '/plans/plan-business.svg' }
								className="jp-landing__plan-icon"
								alt={ __( 'Jetpack Business Plan' ) }
							/>
						</div>
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">
								{ __( 'Welcome to Jetpack Professional' ) }
							</h3>
							<p className="jp-landing__plan-features-text">
								{ __(
									'Full security suite, marketing and revenue automation tools, unlimited video hosting, unlimited themes, enhanced search, and priority support.'
								) }
							</p>
						</div>
					</div>
				);
				break;

			default:
				planCard = (
					<div className="jp-landing__plan-card">
						<div className="jp-landing__plan-card-img is-placeholder" />
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title is-placeholder"> </h3>
							<p className="jp-landing__plan-features-text is-placeholder"> </p>
						</div>
					</div>
				);
				break;
		}
		return <div>{ planCard }</div>;
	}
}
export default connect( state => {
	return {
		showBackups: showBackups( state ),
		plansMainTopUpgradeUrl: getUpgradeUrl( state, 'plans-main-top' ),
	};
} )( MyPlanHeader );
