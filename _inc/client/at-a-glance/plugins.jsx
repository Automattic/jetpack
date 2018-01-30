/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { Component } from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'i18n-calypso';
import includes from 'lodash/includes';

/**
 * Internal dependencies
 */
import QueryPluginUpdates from 'components/data/query-plugin-updates';
import { getPluginUpdates } from 'state/at-a-glance';
import { getModules } from 'state/modules';
import { isDevMode } from 'state/connection';

class DashPluginUpdates extends Component {
	activateAndRedirect( e ) {
		e.preventDefault();
		this.props.activateManage()
			.then( window.location = 'https://wordpress.com/plugins/manage/' + this.props.siteRawUrl );
	}

	getContent() {
		const labelName = __( 'Plugin Updates' );
		const pluginUpdates = this.props.pluginUpdates;
		const manageActive = this.props.getOptionValue( 'manage' );

		if ( 'N/A' === pluginUpdates ) {
			return (
				<DashItem
					label={ labelName }
					module="manage"
					status="is-working" >
					<QueryPluginUpdates />
					<p className="jp-dash-item__description">{ __( 'Loading…' ) }</p>
				</DashItem>
			);
		}

		if ( 'updates-available' === pluginUpdates.code ) {
			return (
				<DashItem
					label={ labelName }
					module="manage"
					status="is-warning"
				>
					<h2 className="jp-dash-item__count">
						{
							__( '%(number)s plugin', '%(number)s plugins', {
								count: pluginUpdates.count,
								args: {
									number: pluginUpdates.count
								}
							} )
						}
					</h2>
					<p className="jp-dash-item__description">
						{
							__( 'Needs updating. ', 'Need updating. ', {
								count: pluginUpdates.count,
								args: {
									number: pluginUpdates.count
								}
							} )
						}
						{
							this.props.isDevMode
								? ''
								: __( '{{a}}Turn on plugin auto updates{{/a}}', { components: { a: <a href={ 'https://wordpress.com/plugins/manage/' + this.props.siteRawUrl } /> } } )
						}
					</p>
				</DashItem>
			);
		}

		return (
			<DashItem
				label={ labelName }
				module="manage"
				status={ manageActive ? 'is-working' : 'is-inactive' } >
				<p className="jp-dash-item__description">
					{
						__( 'All plugins are up-to-date. Awesome work!' )
					}
				</p>
			</DashItem>
		);
	}

	render() {
		const moduleList = Object.keys( this.props.moduleList );
		if ( ! includes( moduleList, 'manage' ) ) {
			return null;
		}

		return (
			<div>
				<QueryPluginUpdates />
				{ this.getContent() }
			</div>
		);
	}
}

DashPluginUpdates.propTypes = {
	isDevMode: PropTypes.bool.isRequired,
	siteRawUrl: PropTypes.string.isRequired,
	siteAdminUrl: PropTypes.string.isRequired,
	pluginUpdates: PropTypes.any.isRequired
};

export default connect(
	( state ) => {
		return {
			pluginUpdates: getPluginUpdates( state ),
			isDevMode: isDevMode( state ),
			moduleList: getModules( state )
		};
	}
)( DashPluginUpdates );
