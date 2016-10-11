/**
 * External dependencies
 */
import React from 'react';
import some from 'lodash/some';
import filter from 'lodash/filter';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
var ButtonsLabelEditor = require( './label-editor' ),
	ButtonsPreviewButtons = require( './preview-buttons' ),
	ButtonsPreviewAction = require( './preview-action' ),
	ButtonsTray = require( './tray');

module.exports = React.createClass( {
	displayName: 'SharingButtonsPreview',

	propTypes: {
		style: React.PropTypes.oneOf( [ 'icon-text', 'icon', 'text', 'official' ] ),
		label: React.PropTypes.string,
		buttons: React.PropTypes.array,
		showLike: React.PropTypes.bool,
		onLabelChange: React.PropTypes.func,
		onButtonsChange: React.PropTypes.func
	},

	getInitialState: function() {
		return {
			isEditingLabel: false,
			buttonsTrayVisibility: null
		};
	},

	getDefaultProps: function() {
		return {
			style: 'icon',
			buttons: [],
			showLike: true,
			onLabelChange: function() {},
			onButtonsChange: function() {}
		};
	},

	toggleEditLabel: function() {
		var isEditingLabel = ! this.state.isEditingLabel;
		this.setState( { isEditingLabel: isEditingLabel } );

		if ( isEditingLabel ) {
			this.hideButtonsTray();
		}
	},

	showButtonsTray: function( visibility ) {
		this.setState( {
			isEditingLabel: false,
			buttonsTrayVisibility: visibility
		} );
	},

	hideButtonsTray: function() {
		if ( ! this.state.buttonsTrayVisibility ) {
			return;
		}

		// Hide button tray by resetting state to default
		this.setState( { buttonsTrayVisibility: null } );
	},

	getButtonsTrayToggleButtonLabel: function( visibility, enabledButtonsExist ) {
		if ( 'visible' === visibility ) {
			if ( enabledButtonsExist ) {
				return __( 'Edit sharing buttons', { context: 'Sharing: Buttons edit label' } );
			} else {
				return __( 'Add sharing buttons', { context: 'Sharing: Buttons edit label' } );
			}
		} else {
			if ( enabledButtonsExist ) {
				return __( 'Edit “More” buttons', { context: 'Sharing: Buttons edit label' } );
			} else {
				return __( 'Add “More” button', { context: 'Sharing: Buttons edit label' } );
			}
		}
	},

	getButtonsTrayToggleButtonElement: function( visibility ) {
		var enabledButtonsExist = some( this.props.buttons, {
			'visibility': visibility,
			enabled: true
		} );

		return (
			<ButtonsPreviewAction
				active={ null === this.state.buttonsTrayVisibility }
				onClick={ this.showButtonsTray.bind( null, visibility ) }
				icon={ enabledButtonsExist ? 'edit' : 'plus' }
				position="bottom-left">
					{ this.getButtonsTrayToggleButtonLabel( visibility, enabledButtonsExist ) }
			</ButtonsPreviewAction>
		);
	},

	getLikeButtonElement: function() {
		if ( this.props.showLike ) {
			return (
				<span>
					<a className="sharing-buttons-preview-button is-enabled style-icon-text sharing-buttons-preview__like">
						<span className="noticon noticon-like" />{ __( 'Like' ) }
					</a>
					<div className="sharing-buttons-preview__fake-user">
						<img src="https://1.gravatar.com/avatar/767fc9c115a1b989744c755db47feb60" />
					</div>
					<div className="sharing-buttons-preview__fake-like">{ __( 'One blogger likes this.' ) }</div>
				</span>
			);
		}
	},

	getPreviewButtonsElement: function() {
		var enabledButtons = filter( this.props.buttons, { enabled: true } );

		if ( enabledButtons.length ) {
			return (
				<ButtonsPreviewButtons
					buttons={ enabledButtons }
					visibility="visible"
					style={ this.props.style }
					showMore={ 'hidden' === this.state.buttonsTrayVisibility || some( this.props.buttons, { visibility: 'hidden' } ) }
					forceMorePreviewVisible={ 'hidden' === this.state.buttonsTrayVisibility } />
			);
		}
	},

	render: function() {
		console.log( this.props.buttons );
		return (
			<div className="sharing-buttons-preview">
				<ButtonsPreviewAction active={ ! this.state.isEditingLabel } onClick={ this.toggleEditLabel } icon="edit" position="top-left">
					{ __( 'Edit label text', { context: 'Sharing: Buttons edit label' } ) }
				</ButtonsPreviewAction>
				<ButtonsLabelEditor
					active={ this.state.isEditingLabel }
					value={ this.props.label }
					onChange={ this.props.onLabelChange }
					onClose={ this.toggleEditLabel }
					hasEnabledButtons={ some( this.props.buttons, { enabled: true } ) } />

				<h2 className="sharing-buttons-preview__heading">{ __( 'Preview' ) }</h2>
				<div className="sharing-buttons-preview__display">
					<span className="sharing-buttons-preview__label">{ this.props.label }</span>
					<div className="sharing-buttons-preview__buttons">
						{ this.getPreviewButtonsElement() }
					</div>

					<div className="sharing-buttons-preview__reblog-like">
						{ this.getLikeButtonElement() }
					</div>
				</div>

				<div className="sharing-buttons-preview__button-tray-actions">
					{ this.getButtonsTrayToggleButtonElement( 'visible' ) }
					{ this.getButtonsTrayToggleButtonElement( 'hidden' ) }
				</div>

				<ButtonsTray
					buttons={ this.props.buttons }
					style={ 'official' === this.props.style ? 'text' : this.props.style }
					visibility={ this.state.buttonsTrayVisibility }
					onButtonsChange={ this.props.onButtonsChange }
					onClose={ this.hideButtonsTray }
					active={ null !== this.state.buttonsTrayVisibility } />
			</div>
		);
	}
} );
