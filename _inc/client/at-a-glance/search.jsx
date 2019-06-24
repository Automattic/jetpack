/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import { noop } from 'lodash';
import { getPlanClass, PLAN_JETPACK_PREMIUM } from 'lib/plans/constants';

/**
 * Internal dependencies
 */
import analytics from 'lib/analytics';
import DashItem from 'components/dash-item';
import Card from 'components/card';
import JetpackBanner from 'components/jetpack-banner';
import { isModuleFound } from 'state/search';
import { isDevMode } from 'state/connection';
import { getSitePlan } from 'state/site';
import { getUpgradeUrl } from 'state/initial-state';

/**
 * Displays a card for Search based on the props given.
 *
 * @param   {object} props Settings to render the card.
 * @returns {object}       Search card
 */
const renderCard = props => (
	<DashItem
		label={ __( 'Jetpack Search' ) }
		module="search"
		support={ {
			text: __(
				'Jetpack Search is a powerful replacement for the search capability built into WordPress.'
			),
			link: 'https://jetpack.com/support/search/',
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
		isDevMode: PropTypes.bool.isRequired,
	};

	static defaultProps = {
		getOptionValue: noop,
		isDevMode: false,
	};

	trackSearchLink() {
		analytics.tracks.recordJetpackClick( {
			type: 'upgrade-link',
			target: 'at-a-glance',
			feature: 'search',
		} );
	}

	activateSearch = () => this.props.updateOptions( { search: true } );

	render() {
		const hasPro = 'is-business-plan' === this.props.planClass;

		if ( this.props.isDevMode ) {
			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				status: 'no-pro-uninstalled-or-inactive',
				pro_inactive: true,
				content: __( 'Unavailable in Dev Mode' ),
			} );
		}

		if ( ! hasPro ) {
			return renderCard( {
				className: 'jp-dash-item__is-inactive',
				status: 'no-pro-uninstalled-or-inactive',
				pro_inactive: true,
				overrideContent: (
					<JetpackBanner
						callToAction={ __( 'Upgrade' ) }
						title={ __(
							"Replace your site's basic search with customizable search that helps visitors find answers faster."
						) }
						disableHref="false"
						href={ this.props.upgradeUrl }
						eventFeature="search"
						path="dashboard"
						plan={ PLAN_JETPACK_PREMIUM }
						icon="search"
					/>
				),
			} );
		}

		if ( this.props.getOptionValue( 'search' ) ) {
			return (
				<div className="jp-dash-item">
					<DashItem
						label={ __( 'Search' ) }
						module="search"
						support={ {
							text: __(
								'Jetpack Search is a powerful replacement for the search capability built into WordPress.'
							),
							link: 'https://jetpack.com/support/search/',
						} }
						className="jp-dash-item__is-active"
						isModule={ false }
						pro={ true }
					>
						<p className="jp-dash-item__description">
							{ __( 'Jetpack Search is powering search on your site.' ) }
						</p>
					</DashItem>
					<Card
						compact
						className="jp-search-config-aag"
						href="customize.php?autofocus[panel]=widgets"
					>
						{ __( 'Add Search (Jetpack) Widget' ) }
					</Card>
				</div>
			);
		}

		return renderCard( {
			className: 'jp-dash-item__is-inactive',
			pro_inactive: false,
			content: __(
				'{{a}}Activate{{/a}} to replace the WordPress built-in search with Jetpack Search, an advanced search experience.',
				{
					components: {
						a: <a href="javascript:void(0)" onClick={ this.activateSearch } />,
					},
				}
			),
		} );
	}
}

export default connect( state => {
	return {
		foundSearch: isModuleFound( state, 'search' ),
		planClass: getPlanClass( getSitePlan( state ).product_slug ),
		isDevMode: isDevMode( state ),
		upgradeUrl: getUpgradeUrl( state, 'aag-search' ),
	};
} )( DashSearch );
