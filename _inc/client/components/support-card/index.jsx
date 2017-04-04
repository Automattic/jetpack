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
import {
	getSiteRawUrl,
	isAutomatedTransfer
} from 'state/initial-state';
import {
	getSitePlan,
	isFetchingSiteData
} from 'state/site';
import JetpackBanner from 'components/jetpack-banner';

const SupportCard = React.createClass( {
	displayName: 'SupportCard',

	trackBannerClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'banner-click',
			feature: 'support',
			page: this.props.path
		} );
	},

	shouldComponentUpdate( nextProps ) {
		return nextProps.sitePlan.product_slug !== this.props.sitePlan.product_slug;
	},

	trackAskQuestionClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'support-card',
			button: 'support-ask',
			page: this.props.path
		} );
	},

	trackSearchClick() {
		analytics.tracks.recordJetpackClick( {
			target: 'support-card',
			button: 'support-search',
			page: this.props.path
		} );
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
							{ __( "We're here to help" ) }
						</h3>
						<p className="jp-support-card__description">
							{
								noPrioritySupport
									? __( 'Jetpack comes with free, basic support for all users.' )
									: __( 'Your paid plan gives you access to prioritized Jetpack support.' )
							}
						</p>
						<p className="jp-support-card__description">
							<Button
								onClick={ this.trackAskQuestionClick }
								href={ this.props.isAutomatedTransfer
									? 'https://wordpress.com/help/contact/'
									: 'https://jetpack.com/contact-support/'
								}
							>
								{ __( 'Ask a question' ) }
							</Button>
							<Button
								onClick={ this.trackSearchClick }
								href={ this.props.isAutomatedTransfer
									? 'https://wordpress.com/help/'
									: 'https://jetpack.com/support/'
								}
							>
								{ __( 'Search our support site' ) }
							</Button>
						</p>
					</div>
				</Card>
				{
					noPrioritySupport && (
						<JetpackBanner
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
			isFetchingSiteData: isFetchingSiteData( state ),
			isAutomatedTransfer: isAutomatedTransfer( state )
		};
	}
)( SupportCard );
