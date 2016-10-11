/**
 * External dependencies
 */
import React from 'react';
import some from 'lodash/some';
import xor from 'lodash/xor';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
var MultiCheckbox = require( 'components/forms/multi-checkbox' ),
	analytics = require( 'lib/analytics' );

module.exports = React.createClass( {
	displayName: 'SharingButtonsOptions',

	propTypes: {
		site: React.PropTypes.object.isRequired,
		buttons: React.PropTypes.array,
		postTypes: React.PropTypes.array,
		values: React.PropTypes.object,
		onChange: React.PropTypes.func,
		saving: React.PropTypes.bool
	},

	getDefaultProps: function() {
		return {
			values: Object.freeze( {} ),
			onChange: function() {},
			saving: false
		};
	},

	getSanitizedTwitterUsername: function( username ) {
		return username ? '@' + username.replace( /\W/g, '' ).substr( 0, 15 ) : '';
	},

	trackTwitterViaAnalyticsEvent: function() {
		analytics.ga.recordEvent( 'Sharing', 'Focussed Twitter Username Field' );
	},

	handleMultiCheckboxChange: function( name, event ) {
		var delta = xor( this.props.values.sharing_show, event.value ),
			checked;

		this.props.onChange( name, event.value.length ? event.value : null );

		if ( delta.length ) {
			checked = -1 !== event.value.indexOf( delta[0] );
			analytics.ga.recordEvent( 'Sharing', 'Clicked Show Sharing Buttons On Page Checkbox', delta[0], checked ? 1 : 0 );
		}
	},

	handleTwitterViaChange: function( event ) {
		this.props.onChange( event.target.name, this.getSanitizedTwitterUsername( event.target.value ) );
	},

	handleChange: function( event ) {
		var value;
		if ( 'checkbox' === event.target.type ) {
			value = event.target.checked;
		} else {
			value = event.target.value;
		}

		if ( 'jetpack_comment_likes_enabled' === event.target.name ) {
			analytics.ga.recordEvent( 'Sharing', 'Clicked Comment Likes On For All Posts Checkbox', 'checked', event.target.checked ? 1 : 0 );
		}

		this.props.onChange( event.target.name, value );
	},

	getPostTypeLabel: function( postType ) {
		var label;

		switch ( postType.name ) {
			case 'index': label = __( 'Front Page, Archive Pages, and Search Results', { context: 'jetpack' } ); break;
			case 'post': label = __( 'Posts' ); break;
			case 'page': label = __( 'Pages' ); break;
			case 'attachment': label = __( 'Media' ); break;
			case 'portfolio': label = __( 'Portfolio Items' ); break;
			default: label = postType.label;
		}

		return label;
	},

	getDisplayOptions: function() {
		return [
			{ name: 'index' }
		].concat( this.props.postTypes ).map( function( postType ) {
			return {
				value: postType.name,
				label: this.getPostTypeLabel( postType )
			};
		}, this );
	},

	isTwitterButtonEnabled: function() {
		return some( this.props.buttons, { ID: 'twitter', enabled: true } );
	},

	getTwitterViaOptionElement: function() {
		if ( ! this.isTwitterButtonEnabled() ) {
			return;
		}

		return (
			<fieldset className="sharing-buttons__fieldset">
				<legend className="sharing-buttons__fieldset-heading">{ __( 'Twitter username' ) }</legend>
				<input
					name="jetpack-twitter-cards-site-tag"
					type="text"
					placeholder={ '@' + __( 'username', { textOnly: true } ) }
					value={ this.getSanitizedTwitterUsername( this.props.values[ option ] ) }
					onChange={ this.handleTwitterViaChange }
					onFocus={ this.trackTwitterViaAnalyticsEvent } />
				<p className="sharing-buttons__fieldset-detail">
					{ __( 'This will be included in tweets when people share using the Twitter button.' ) }
				</p>
			</fieldset>
		);
	},

	render: function() {
		return (
			<div className="sharing-buttons__panel">
				<h4>{ __( 'Options' ) }</h4>
				<div className="sharing-buttons__fieldset-group">
					<fieldset className="sharing-buttons__fieldset">
						<legend className="sharing-buttons__fieldset-heading">
							{ __( 'Show sharing buttons on', {
								context: 'Sharing options: Header',
								comment: 'Possible values are: "Front page, Archive Pages, and Search Results", "Posts", "Pages", "Media"'
							} ) }
						</legend>
						<MultiCheckbox name="sharing_show" options={ this.getDisplayOptions() } checked={ this.props.values.sharing_show } onChange={ this.handleMultiCheckboxChange.bind( null, 'sharing_show' ) } />
					</fieldset>
					{ this.getTwitterViaOptionElement() }
				</div>

				<button type="submit" className="button is-primary sharing-buttons__submit" disabled={ this.props.saving }>
					{ this.props.saving ? __( 'Saving…' ) : __( 'Save Changes' ) }
				</button>
			</div>
		);
	}
} );
