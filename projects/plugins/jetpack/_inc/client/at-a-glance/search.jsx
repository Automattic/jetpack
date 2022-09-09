import { getRedirectUrl } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import Card from 'components/card';
import DashItem from 'components/dash-item';
import JetpackBanner from 'components/jetpack-banner';
import analytics from 'lib/analytics';
import { getJetpackProductUpsellByFeature, FEATURE_SEARCH_JETPACK } from 'lib/plans/constants';
import { noop } from 'lodash';
import { getProductDescriptionUrl } from 'product-descriptions/utils';
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { hasConnectedOwner, isOfflineMode, connectUser } from 'state/connection';
import { siteHasFeature, isFetchingSitePurchases } from 'state/site';

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
		trackUpgradeBanner: PropTypes.func,

		// Connected props
		isOfflineMode: PropTypes.bool.isRequired,
		hasConnectedOwner: PropTypes.bool.isRequired,
	};

	static defaultProps = {
		getOptionValue: noop,
		isOfflineMode: false,
		trackUpgradeBanner: noop,
	};

	trackConfigureSearchLink = () => {
		analytics.tracks.recordJetpackClick( {
			type: 'configure-search-link',
			target: 'at-a-glance',
			feature: 'search',
		} );
	};

	trackAddSearchWidgetLink = () => {
		analytics.tracks.recordJetpackClick( {
			type: 'search-widget-link',
			target: 'at-a-glance',
			feature: 'search',
		} );
	};

	activateSearch = () => {
		this.props.updateOptions( {
			search: true,
			...( this.props.hasInstantSearch ? { instant_search_enabled: true } : {} ),
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

		if ( ! this.props.hasClassicSearch && ! this.props.hasInstantSearch ) {
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
						trackBannerDisplay={ this.props.trackUpgradeButtonView }
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
					{ this.props.hasInstantSearch ? (
						<Card
							compact
							className="jp-search-config-aag"
							href="admin.php?page=jetpack-search-configure"
							onClick={ this.trackConfigureSearchLink }
						>
							{ SEARCH_CUSTOMIZE_CTA }
						</Card>
					) : (
						<Card
							compact
							className="jp-search-config-aag"
							href="customize.php?autofocus[panel]=widgets"
							onClick={ this.trackAddSearchWidgetLink }
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
			isOfflineMode: isOfflineMode( state ),
			isFetching: isFetchingSitePurchases( state ),
			hasClassicSearch: siteHasFeature( state, 'search' ),
			hasInstantSearch: siteHasFeature( state, 'instant-search' ),
			upgradeUrl: getProductDescriptionUrl( state, 'search' ),
			hasConnectedOwner: hasConnectedOwner( state ),
		};
	},
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( DashSearch );
