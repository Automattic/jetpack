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
				<h4>Need help? The Jetpack team is here for you.</h4>
				<p>We offer free, full support to all of our Jetpack users. Our support team is always around to help you. View our support page, check the forums for answers, or contact us directly.</p>
			</Card>
			<Card className="jp-support-card__social">
				<p>Enjoying Jetpack or have feedback?  Leave us a review, follow us on twitter, or like us on facebook.</p>
			</Card>
			</div>
		);
	}
} );