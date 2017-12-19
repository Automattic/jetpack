/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';

/**
 * Internal dependencies
 */
import JetpackDialogue from 'components/jetpack-dialogue';
import { imagePath } from 'constants/urls';

class UpgradeNoticeContent extends Component {
	renderInnerContent() {
		return (
			<div>
				<p>
					{ __( 'With this release, your contact form just got a bit sweeter. We moved the big old button ' +
						"right down into your editor's toolbar on the right. Yes, it's a little smaller, but it fits " +
						"in a bit better, don't you think? Oh and all your forms now have a preview that can be edited " +
						'all right inside the editor.' ) }
				</p>

				<img src={ imagePath + 'cf-ss.png' } alt={ __( 'Contact Form screen shot' ) } />

				<p>
					{ __( "To use it, just open up a post or page to the visual editor. From there, you'll find a button " +
						'inside the toolbar with an icon that looks a bit like the contact form. It is usually furthest ' +
						'to the right. Then just click the button and, voila, a contact form has been created!' ) }
				</p>

				<p>
					{ __( 'You will likely want to customize it to properly encourage folks to contact you. To do that, ' +
						"simply select the contact form preview and then click or tap the edit button. It's the one that " +
						'looks like a pencil.' ) }
				</p>

				<div className="jp-dialogue__cta-container">
					<Button
						primary={ true }
						href={ this.props.adminUrl + 'post-new.php' }
					>
						{ __( 'Try it out!' ) }
					</Button>

					<p className="jp-dialogue__note">
						<a href="https://jetpack.com/?p=22509">{ __( 'Read the full release post' ) }</a>
					</p>
				</div>
			</div>
		);
	}

	render() {
		return (
			<JetpackDialogue
				svg={ <img src={ imagePath + 'people-around-page.svg' } width="250" alt={ __( 'People around page' ) } /> }
				title={ __( 'A new contact form is here at last!' ) }
				content={ this.renderInnerContent() }
				dismiss={ this.props.dismiss }
			/>
		);
	}
}

JetpackDialogue.propTypes = {
	dismiss: PropTypes.func
};

export default UpgradeNoticeContent;
