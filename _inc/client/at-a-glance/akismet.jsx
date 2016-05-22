/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import DashItem from 'components/dash-item';
import { translate as __ } from 'lib/mixins/i18n';

/**
 * Internal dependencies
 */
import QueryAkismetData from 'components/data/query-akismet-data';
import {
	getAkismetData as _getAkismetData
} from 'state/at-a-glance';
import {
	isModuleActivated as _isModuleActivated,
	activateModule
} from 'state/modules';

const DashAkismet = React.createClass( {
	activateManageAndRedirect: function( e ) {
		e.preventDefault();

		this.props.activateModule( 'manage' )
			.then( window.location = 'https://wordpress.com/plugins/akismet/' + window.Initial_State.rawUrl )
			.catch( console.log( 'Error: unable to activate Manage' ) );
	},

	getContent: function() {
		const akismetData = this.props.getAkismetData();
		const akismetSettingsUrl = window.Initial_State.adminUrl + 'admin.php?page=akismet-key-config';
		const manageActive = this.props.isModuleActivated( 'manage' );
		const labelName = __( 'Anti-spam' ) + ' (Akismet)';

		if ( akismetData === 'N/A' ) {
			return(
				<DashItem label="Anti-spam (Akismet)">
					<p className="jp-dash-item__description">
						{ __( 'Loading' ) }&#8230;
					</p>
				</DashItem>
			);
		}

		if ( manageActive ) {
			if ( akismetData === 'not_active' ) {
				return(
					<DashItem label={ labelName } className="jp-dash-item__is-inactive">
						<p className="jp-dash-item__description">
							{
								__( '{{a}}Activate Akismet{{/a}} to automatically block spam comments and more.', {
									components: {
										a: <a href={ 'https://wordpress.com/plugins/akismet/' + window.Initial_State.rawUrl } target="_blank" />
									}
								} )
							}
						</p>
					</DashItem>
				);
			}

			if ( akismetData === 'not_installed' ) {
				return(
					<DashItem label={ labelName } className="jp-dash-item__is-inactive">
						<p className="jp-dash-item__description">
							{
								__( '{{a}}Install Akismet{{/a}} to automatically block spam comments and more.', {
									components: {
										a: <a href={ 'https://wordpress.com/plugins/akismet/' + window.Initial_State.rawUrl } target="_blank" />
									}
								} )
							}
						</p>
					</DashItem>
				);
			}
		} else {
			if ( akismetData === 'not_active' ) {
				return(
					<DashItem label={ labelName } className="jp-dash-item__is-inactive">
						<p className="jp-dash-item__description">
							{
								__( '{{a}}Activate Manage and Akismet{{/a}} to automatically block spam comments and more.', {
									components: {
										a: <a onClick={ this.activateManageAndRedirect } href='#' />
									}
								} )
							}
						</p>
					</DashItem>
				);
			}

			if ( akismetData === 'not_installed' ) {
				return(
					<DashItem label={ labelName } className="jp-dash-item__is-inactive">
						<p className="jp-dash-item__description">
							{
								__( '{{a}}Activate Manage and Install Akismet{{/a}} to automatically block spam comments and more.', {
									components: {
										a: <a onClick={ this.activateManageAndRedirect } href='#' />
									}
								} )
							}
						</p>
					</DashItem>
				);
			}
		}

		if ( akismetData === 'invalid_key' ) {
			return(
				<DashItem label="Anti-spam (Akismet)" className="jp-dash-item__is-inactive" status="is-warning">
					<p className="jp-dash-item__description">
						{ __( 'Whoops! It appears your Akismet key is missing or invalid.' ) }<br/>
						<a href={ akismetSettingsUrl }>
							{ __( 'Go to Akismet settings to fix' ) }
						</a></p>
				</DashItem>
			);
		}

		return(
			<DashItem label="Anti-spam (Akismet)" status="is-working">
				<h2 className="jp-dash-item__count">{ akismetData.all.spam }</h2>
				<p className="jp-dash-item__description">
					{
						__( 'Spam comments blocked.', {
							comment: 'Referring to a number of how many comments were blocked. Example "412 Spam comments blocked"'
						} )
					}
				</p>
				{/*
				<strong>This is the data we could show here: </strong> <br/>
				Spam blocked all-time: { akismetData.all.spam } <br/>
				Time saved ( in seconds ): { akismetData.all.time_saved } <br/>
				Accuracy: { akismetData.all.accuracy } <br/>
				false positives: { akismetData.all.false_positives }
				*/}
			</DashItem>
		);
	},

	render: function() {
		return(
			<div className="jp-dash-item__interior">
				<QueryAkismetData />
				{ this.getContent() }
			</div>
		);
	}
} );

export default connect(
	( state ) => {
		return {
			getAkismetData: () => _getAkismetData( state ),
			isModuleActivated: ( module_name ) => _isModuleActivated( state, module_name )
		};
	},
	( dispatch ) => {
		return {
			activateModule: ( slug ) => {
				return dispatch( activateModule( slug ) );
			}
		}
	}
)( DashAkismet );
