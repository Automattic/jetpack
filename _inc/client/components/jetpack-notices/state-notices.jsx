/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import { translate as __ } from 'i18n-calypso';
import SimpleNotice from 'components/notice';

const JetpackStateNotices = React.createClass( {
	displayName: 'JetpackStateNotices',
	getInitialState: function() {
		return { showNotice: true };
	},

	/**
	 * Only need to hide.  They will not appear on next page load.
	 */
	dismissJetpackStateNotice: function() {
		this.setState( { showNotice: false } );
	},

	getErrorFromKey: function( key ) {
		switch ( key ) {
			
			default:
				return key;
		}
	},

	getMessageFromKey: function( key ) {
		switch ( key ) {

			default:
				return key;
		}
	},

	renderContent: function() {
		let noticeText = '';
		const error = window.Initial_State.jetpackStateNotices.errorCode,
			message = window.Initial_State.jetpackStateNotices.messageCode;

		if ( ! error && ! message ) {
			return;
		}

		if ( error ) {
			noticeText = this.getErrorFromKey( error );
		}

		if ( message ) {
			noticeText = this.getMessageFromKey( message );
		}

		return (
			<SimpleNotice
				status="is-info"
				onClick={ this.dismissJetpackStateNotice }
			>
				{ noticeText }
			</SimpleNotice>
		);
	},

	render() {
		return (
			<div>
				{ this.state.showNotice ? this.renderContent() : null }
			</div>
		);
	}
} );

export default JetpackStateNotices;
