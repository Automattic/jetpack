/**
 * External dependencies
 */
import React from 'react';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
var ButtonsPreview = require( './preview' ),
	ButtonsPreviewPlaceholder = require( './preview-placeholder' ),
	ButtonsStyle = require( './style' );

module.exports = React.createClass( {
	displayName: 'SharingButtonsAppearance',

	propTypes: {
		buttons: React.PropTypes.array,
		values: React.PropTypes.object,
		onChange: React.PropTypes.func,
		onButtonsChange: React.PropTypes.func,
		onButtonsSave: React.PropTypes.func,
		saving: React.PropTypes.bool
	},

	getDefaultProps: function() {
		return {
			buttons: Object.freeze( [] ),
			values: Object.freeze( {} ),
			onChange: function() {},
			onButtonsChange: function() {},
			saving: false
		};
	},

	onReblogsLikesCheckboxClicked: function( event ) {
		this.props.onChange( event.target.name, ! event.target.checked );
	},

	getPreviewElement: function() {
		return (
			<ButtonsPreview
				style={ this.props.button_style }
				label={ this.props.label }
				buttons={ this.props.buttons }
				showLike={ ( '' === this.props.values.disabled_likes || false === this.props.values.disabled_likes ) }
				onLabelChange={ this.props.onChange.bind( null, 'sharing_label' ) }
				onButtonsChange={ this.props.onButtonsChange } />
		);
	},

	getReblogLikeOptionsElement: function() {
		return (
			<fieldset className="sharing-buttons__fieldset">
				<legend className="sharing-buttons__fieldset-heading">
					{ __( 'Reblog & Like', { context: 'Sharing options: Header' } ) }
				</legend>
				<label>
					<input name="disabled_likes" type="checkbox" checked={ '' === this.props.values.disabled_likes || false === this.props.values.disabled_likes } onChange={ this.onReblogsLikesCheckboxClicked } disabled={ ! this.props.initialized } />
					<span>{ __( 'Show like button', { context: 'Sharing options: Checkbox label' } ) }</span>
				</label>
			</fieldset>
		);
	},

	render: function() {
		return (
			<div className="sharing-buttons__panel sharing-buttons-appearance">
				<p className="sharing-buttons-appearance__description">
					{ __( 'Allow readers to easily share your posts with others by adding sharing buttons throughout your site.' ) }
				</p>

				{ this.getPreviewElement() }

				<div className="sharing-buttons__fieldset-group">
					<ButtonsStyle onChange={ this.props.onChange.bind( null, 'sharing_button_style' ) } value={ this.props.values.sharing_button_style } disabled={ ! this.props.initialized } />
					{ this.getReblogLikeOptionsElement() }
				</div>

				<button type="submit" className="button is-primary sharing-buttons__submit" disabled={ this.props.saving || ! this.props.initialized }>
					{ this.props.saving ? __( 'Saving…' ) : __( 'Save Changes' ) }
				</button>
			</div>
		);
	}
} );
