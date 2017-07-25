/**
 * External dependencies
 */
import React from 'react';
import { Component } from 'react';
import { translate as __ } from 'i18n-calypso';
import Button from 'components/button';

class UpgradeNoticeContent extends Component {
	render() {
		return (
			<div>
				<p>
					{ __( 'With this release, your contact form just got a bit sweeter. We moved the big old button ' +
						"right down into your editor's toolbar on the right. Yes, it's a little smaller, but it fits " +
						"in a bit better, don't you think? Oh and all your forms now have a preview that can be edited" +
						'all right inside the editor.' ) }
				</p>

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

				<Button
					primary={ true }
					href="#"
				>
					{ __( 'Try it out!' ) }
				</Button>

				<p className="jp-dialogue__note">
					<a href="#">{ __( 'Read the full release post' ) }</a>
				</p>
			</div>
		);
	}
}

export default UpgradeNoticeContent;