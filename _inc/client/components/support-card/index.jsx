/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import sampleSize from 'lodash/sampleSize';
import { translate as __ } from 'i18n-calypso';
import Card from 'components/card';
import Button from 'components/button';

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
import { getHappinessGravatarIds } from 'state/initial-state';
import Banner from 'components/banner';

const SupportCard = React.createClass( {
	displayName: 'SupportCard',

	render() {
		const classes = classNames(
				this.props.className,
				'jp-support-card'
			),
			gravIds = sampleSize( this.props.happinessGravatarIds, 3 ),
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
								href="https://jetpack.com/contact-support/">
								{ __( 'Ask a question' ) }
							</Button>
							<Button
								href="https://jetpack.com/support/">
								{ __( 'Search our support site' ) }
							</Button>
						</p>
					</div>
					<div className="jp-support-card__happiness-engineer">
						<ul>
							<li>
								<img
									src={ 'https://secure.gravatar.com/avatar/' + gravIds[ 0 ].avatar }
									alt={ __( 'Jetpack Happiness Engineer' ) }
									className="jp-support-card__happiness-engineer-img"
									width="72"
									height="72"
								/>
								<div>
									<em className="jp-support-card__happiness-engineer-name">{ gravIds[ 0 ].name }</em>
								</div>
							</li>
							<li>
								<img
									src={ 'https://secure.gravatar.com/avatar/' + gravIds[ 1 ].avatar }
									alt={ __( 'Jetpack Happiness Engineer' ) }
									className="jp-support-card__happiness-engineer-img"
									width="72"
									height="72"
								/>
								<div>
									<em className="jp-support-card__happiness-engineer-name">{ gravIds[ 1 ].name }</em>
								</div>
							</li>
							<li>
								<img
									src={ 'https://secure.gravatar.com/avatar/' + gravIds[ 2 ].avatar }
									alt={ __( 'Jetpack Happiness Engineer' ) }
									className="jp-support-card__happiness-engineer-img"
									width="72"
									height="72"
								/>
								<div>
									<em className="jp-support-card__happiness-engineer-name">{ gravIds[ 2 ].name }</em>
								</div>
							</li>
						</ul>
					</div>
				</Card>
				{
					( ! this.props.fetchingSiteData && noPrioritySupport ) && (
						<Banner
							title={ __( 'Need help quicker? Upgrade for priority support' ) }
							plan={ PLAN_JETPACK_PERSONAL }
							href={ 'https://jetpack.com/redirect/?source=support&site=' + this.props.siteRawUrl }
						/>
					)
				}
			</div>
		);
	}
} );

SupportCard.propTypes = {
	className: React.PropTypes.string,
	happinessGravatarIds: React.PropTypes.array.isRequired
};

export default connect(
	state => {
		return {
			sitePlan: getSitePlan( state ),
			siteRawUrl: getSiteRawUrl( state ),
			fetchingSiteData: isFetchingSiteData( state ),
			happinessGravatarIds: getHappinessGravatarIds( state )
		};
	}
)( SupportCard );
