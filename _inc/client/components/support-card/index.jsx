/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import Button from 'components/button';
import analytics from 'lib/analytics';

/**
 * Internal dependencies
 */
import {
	PLAN_JETPACK_PERSONAL
} from 'lib/plans/constants';
import { getSiteRawUrl } from 'state/initial-state';
import {
	getSitePlan,
	isFetchingSiteData
} from 'state/site';
import Banner from 'components/banner';

const SupportCard = React.createClass( {
	displayName: 'SupportCard',

	trackBannerClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'banner-click',
			feature: 'support'
		} );
	},

	trackAskQuestionClick() {
		analytics.tracks.recordJetpackClick( 'support-ask' );
	},

	trackSearchClick() {
		analytics.tracks.recordJetpackClick( 'support-search' );
	},

	render() {
		if ( 'undefined' === typeof this.props.sitePlan.product_slug && this.props.isFetchingSiteData ) {
			return <div />;
		}

		const classes = classNames(
				this.props.className,
				'jp-support-card'
			),
			noPrioritySupport = 'undefined' === typeof this.props.sitePlan.product_slug || 'jetpack_free' === this.props.sitePlan.product_slug;

		return (
			<div className={ classes }>
				<Card className="jp-support-card__happiness">
					<div className="jp-support-card__happiness-contact">
						<h3 className="jp-support-card__header">
							{ __( "We're here to help." ) }
						</h3>
						<p className="jp-support-card__description">
							{
								noPrioritySupport
									? __( 'Utilize your free Jetpack support whenever you need.' )
									: __( 'Utilize your priority-speed Jetpack support whenever you need it thanks to your paid plan.' )
							}
						</p>
						<p className="jp-support-card__description">
							<Button
								onClick={ this.trackAskQuestionClick }
								href="https://jetpack.com/contact-support/">
								{ __( 'Ask a question' ) }
							</Button>
							<Button
								onClick={ this.trackSearchClick }
								href="https://jetpack.com/support/">
								{ __( 'Search our support site' ) }
							</Button>
						</p>
					</div>
				</Card>
				{
					noPrioritySupport && (
						<Banner
							title={ __( 'Get a faster resolution to your support questions.' ) }
							plan={ PLAN_JETPACK_PERSONAL }
							callToAction={ __( 'Upgrade' ) }
							onClick={ this.trackBannerClick }
							href={ 'https://jetpack.com/redirect/?source=support&site=' + this.props.siteRawUrl }
						/>
					)
				}
			</div>
		);
	}
} );

SupportCard.propTypes = {
	className: React.PropTypes.string
};

export default connect(
	state => {
		return {
			sitePlan: getSitePlan( state ),
			siteRawUrl: getSiteRawUrl( state ),
			isFetchingSiteData: isFetchingSiteData( state )
		};
	}
)( SupportCard );
