/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Card from 'components/card';

export default React.createClass( {
	displayName: 'SupportCard',

	render() {
		const classes = classNames(
			this.props.className,
			'jp-support-card'
		);

		return (
			<div className={ classes }>
				<Card className="jp-support-card__happiness">
					<h4 className="jp-support-card__header">Need help? The Jetpack team is here for you.</h4>
					<p className="jp-support-card__desc">We offer free, full support to all of our Jetpack users. Our support team is always around to help you. </p>
					<p className="jp-support-card__desc"><a href="http://jetpack.com/support/" title="Go to Jetpack.com/support" target="_blank">View our support page</a>, <a href="https://wordpress.org/support/plugin/jetpack" title="Go to the WordPress.org support forums" target="_blank">check the forums for answers</a>, or <a href="https://jetpack.com/contact-support/" title="Contact Jetpack support staff directly" target="_blank">contact us directly</a>.</p>
				</Card>
				<Card className="jp-support-card__social">
					<p className="jp-support-card__desc">Enjoying Jetpack or have feedback? <a href="https://wordpress.org/support/view/plugin-reviews/jetpack" title="Leave a Jetpack review" target="_blank">Leave us a review</a>, <a href="http://twitter.com/jetpack" title="Follow Jetpack on Twitter" target="_blank">follow us on twitter</a>, or <a href="https://www.facebook.com/jetpackme" title="Like us on facebook" target="_blank">like us on facebook.</a> </p>
				</Card>
			</div>
		);
	}
} );