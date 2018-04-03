/**
 * Publicize share component.
 *
 * Displays form to edit Publicize message
 * before sharing and provides the button
 * to submit request to share.
 *
 * @since  5.9.1
 */

/**
 * External dependencies
 */
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
const { __, _n, sprintf } = wp.i18n;
import { sharePost } from './async-publicize-lib'


const MAX_MESSAGE_LENGTH = 280;

class PublicizeShare extends Component {

	constructor( props ) {
		super( props );
		this.state = {
			shareMessage: '',
			saving: false
		};
	}

	remainingCharacterCount() {
		let charactersRemaining = MAX_MESSAGE_LENGTH - this.state.shareMessage.length;
		return ( charactersRemaining > 0 ? charactersRemaining : 0 );
	}

	gatherAndShare = () => {
		let post_id;
		let share_message;
		post_id = jQuery('#post_ID').val();
		sharePost( post_id, this.state.shareMessage ).done(this.doneSharing)
	};

	onShareMessageChange = ( event ) => {
		this.setState( { shareMessage: event.target.value } );
	}

	doneSharing = () => {
		alert("Test alert: finished sharing")
	};

	render() {
		return (
			<div>
				<form className='jetpack-publicize-form'>
					<label htmlFor='jetpack-publicize-message-box'>
						{ __('Customize your message') }
					</label>
					<textarea
						id='jetpack-publicize-message-box'
						value={ this.state.shareMessage }
						onChange={ this.onShareMessageChange }
						maxLength={ MAX_MESSAGE_LENGTH }
						placeholder={ __('Publicize + Gutenberg :)') }
						/>
					<div className="jetpack-publicize-message-count">{ sprintf( _n( '%d character remaining', '%d characters remaining', this.remainingCharacterCount() ), this.remainingCharacterCount() ) }</div>
					<button onClick={ this.gatherAndShare } type='button' className='button-primary'>
						{ __('Share') }
					</button>
				</form>
			</div>
		);
	}
}


export default PublicizeShare;
