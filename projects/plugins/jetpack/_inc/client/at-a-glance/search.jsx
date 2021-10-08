/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { noop } from 'lodash';

/**
 * WordPress dependencies
 */
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getRedirectUrl } from '@automattic/jetpack-components';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import Card from 'components/card';
import DashItem from 'components/dash-item';
import {
	getPlanClass,
	getJetpackProductUpsellByFeature,
	FEATURE_SEARCH_JETPACK,
} from 'lib/plans/constants';
import { getSitePlan, hasActiveSearchPurchase, isFetchingSitePurchases } from 'state/site';
import { getUpgradeUrl } from 'state/initial-state';
import { hasConnectedOwner, isOfflineMode, connectUser } from 'state/connection';
import JetpackBanner from 'components/jetpack-banner';

const SEARCH_DESCRIPTION = __(
	'Incredibly powerful and customizable, Jetpack Search helps your visitors instantly find the right content – right when they need it.',
	'jetpack'
);
const SEARCH_CUSTOMIZE_CTA = __( 'Customize your Search experience.', 'jetpack' );
const SEARCH_SUPPORT = __( 'Search supports many customizations. ', 'jetpack' );

/**
 * Displays a card for Search based on the props given.
 *
 * @param   {object} props Settings to render the card.
 * @returns {object}       Search card
 */
const renderCard = props => (
	<DashItem
		label={ __( 'Search', 'jetpack' ) }
		module="search"
		support={ {
			text: SEARCH_SUPPORT,
			link: getRedirectUrl( 'jetpack-support-search' ),
		} }
		className={ props.className }
		status={ props.status }
		isModule={ props.pro_inactive }
		pro={ true }
		overrideContent={ props.overrideContent }
	>
		<p className="jp-dash-item__description">{ props.content }</p>
	</DashItem>
);

class DashSearch extends Component {
	static propTypes = {
		getOptionValue: PropTypes.func.isRequired,

		// Connected props
		isOfflineMode: PropTypes.bool.isRequired,
		hasConnectedOwner: PropTypes.string.isRequired,
	};

	static defaultProps = {
		getOptionValue: noop,
		isOfflineMode: false,
	};

	trackSearchLink() {
		analytics.tracks.recordJetpackClick( {
			type: 'upgrade-link',
			target: 'at-a-glance',
			feature: 'search',
		} );
	}

	activateSearch = () => {
		this.props.updateOptions( {
			search: true,
			...( this.props.hasSearchProduct ? { instant_search_enabled: true } : {} ),
		} );
	};

	render() {
		if ( this.props.isFetching ) {
			return renderCard( {
				status: '',
				content: __( 'Loading…', 'jetpack' ),
			} );
		}

		if ( this.props.isOfflineMode ) {
			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				status: 'no-pro-uninstalled-or-inactive',
				pro_inactive: true,
				content: __( 'Unavailable in Offline Mode', 'jetpack' ),
			} );
		}

		if ( ! this.props.isBusinessPlan && ! this.props.hasSearchProduct ) {
			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				status: 'no-pro-uninstalled-or-inactive',
				pro_inactive: true,
				overrideContent: this.props.hasConnectedOwner ? (
					<JetpackBanner
						callToAction={ __( 'Upgrade', 'jetpack' ) }
						title={ SEARCH_DESCRIPTION }
						disableHref="false"
						href={ this.props.upgradeUrl }
						eventFeature="search"
						path="dashboard"
						plan={ getJetpackProductUpsellByFeature( FEATURE_SEARCH_JETPACK ) }
						icon="search"
					/>
				) : (
					<JetpackBanner
						callToAction={ __( 'Connect', 'jetpack' ) }
						title={ __(
							'Connect your WordPress.com account to upgrade and get Jetpack Search, which helps your visitors instantly find the right content – right when they need it.',
							'jetpack'
						) }
						disableHref="false"
						onClick={ this.props.connectUser }
						eventFeature="search"
						path="dashboard"
						plan={ getJetpackProductUpsellByFeature( FEATURE_SEARCH_JETPACK ) }
						icon="search"
					/>
				),
			} );
		}

		if ( this.props.getOptionValue( 'search' ) ) {
			return (
				<div className="jp-dash-item">
					<DashItem
						label={ __( 'Search', 'jetpack' ) }
						module="search"
						support={ {
							text: SEARCH_SUPPORT,
							link: getRedirectUrl( 'jetpack-support-search' ),
						} }
						className="jp-dash-item__is-active"
						isModule={ false }
						pro={ true }
					>
						<p className="jp-dash-item__description">
							{ __( 'Jetpack Search is powering search on your site.', 'jetpack' ) }
						</p>
					</DashItem>
					{ this.props.hasSearchProduct ? (
						<Card
							compact
							className="jp-search-config-aag"
							href="admin.php?page=jetpack-search-configure"
						>
							{ SEARCH_CUSTOMIZE_CTA }
						</Card>
					) : (
						<Card
							compact
							className="jp-search-config-aag"
							href="customize.php?autofocus[panel]=widgets"
						>
							{ __( 'Add Search (Jetpack) Widget', 'jetpack' ) }
						</Card>
					) }
				</div>
			);
		}

		return renderCard( {
			className: 'jp-dash-item__is-inactive',
			pro_inactive: false,
			content: createInterpolateElement(
				__(
					'<a>Activate</a> to help visitors quickly find answers with highly relevant instant search results and powerful filtering.',
					'jetpack'
				),
				{
					a: <a href="javascript:void(0)" onClick={ this.activateSearch } />,
				}
			),
		} );
	}
}

export default connect(
	state => {
		return {
			isBusinessPlan: 'is-business-plan' === getPlanClass( getSitePlan( state ).product_slug ),
			isOfflineMode: isOfflineMode( state ),
			isFetching: isFetchingSitePurchases( state ),
			hasSearchProduct: hasActiveSearchPurchase( state ),
			upgradeUrl: getUpgradeUrl( state, 'aag-search' ),
			hasConnectedOwner: hasConnectedOwner( state ),
		};
	},
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashSearch );
