/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';
import { connect } from 'react-redux';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import ChecklistCta from './checklist-cta';
import ChecklistProgress from './checklist-progress-card';
import { getPlanClass } from 'lib/plans/constants';
import { getUpgradeUrl, getSiteRawUrl, showBackups } from 'state/initial-state';
import { imagePath } from 'constants/urls';

class MyPlanHeader extends React.Component {
	trackLearnMore = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'learn-more',
			plan: 'free',
			page: 'plans',
		} );
	};

	trackChecklistCtaClick = () =>
		void analytics.tracks.recordEvent(
			'jetpack_myplan_headerchecklistcta_click',
			this.props.plan
				? {
						plan: this.props.plan,
				  }
				: undefined
		);

	render() {
		const { plan, siteSlug } = this.props;
		let planCard = '';
		switch ( getPlanClass( plan ) ) {
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
								{ __( 'Your plan: Jetpack Free' ) }
							</h3>
							<p className="jp-landing__plan-features-text">
								{ __( 'Get started with hassle-free design, stats, and performance tools.' ) }
							</p>
							<ChecklistCta onClick={ this.trackChecklistCtaClick } siteSlug={ siteSlug } />
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
								{ __( 'Your plan: Jetpack Personal' ) }
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
							<ChecklistCta onClick={ this.trackChecklistCtaClick } siteSlug={ siteSlug } />
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
						<div className="jp-landing__plan-card-current">
							<h3 className="jp-landing__plan-features-title">
								{ __( 'Your plan: Jetpack Premium' ) }
							</h3>
							<p className="jp-landing__plan-features-text">
								{ __(
									'Full security suite, marketing and revenue automation tools, unlimited video hosting, and priority support.'
								) }
							</p>
							<ChecklistCta onClick={ this.trackChecklistCtaClick } siteSlug={ siteSlug } />
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
								{ __( 'Your plan: Jetpack Professional' ) }
							</h3>
							<p className="jp-landing__plan-features-text">
								{ __(
									'Full security suite, marketing and revenue automation tools, unlimited video hosting, unlimited themes, enhanced search, and priority support.'
								) }
							</p>
							<ChecklistCta onClick={ this.trackChecklistCtaClick } siteSlug={ siteSlug } />
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
		return (
			<>
				<div>{ planCard }</div>
				<ChecklistProgress plan={ plan } />
			</>
		);
	}
}
export default connect( state => {
	return {
		siteSlug: getSiteRawUrl( state ),
		showBackups: showBackups( state ),
		plansMainTopUpgradeUrl: getUpgradeUrl( state, 'plans-main-top' ),
	};
} )( MyPlanHeader );
