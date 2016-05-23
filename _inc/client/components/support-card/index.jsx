/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';
import sample from 'lodash/sample';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import { getHappinessGravatarIds } from 'state/initial-state';

export default React.createClass( {
	displayName: 'SupportCard',

	render() {
		const classes = classNames(
			this.props.className,
			'jp-support-card'
		);

		const randomGravID = sample( getHappinessGravatarIds( this.props ) );

		return (
			<div className={ classes }>
				<Card className="jp-support-card__happiness">
					<div className="jp-support-card__happiness-engineer">
						<img src={ 'https://secure.gravatar.com/avatar/' + randomGravID } alt="Jetpack Happiness Engineer" className="jp-support-card__happiness-engineer-img" />
					</div>
					<div className="jp-support-card__happiness-contact">
						<h4 className="jp-support-card__header">Need help? The Jetpack team is here for you.</h4>
						<p className="jp-support-card__description">We offer free, full support to all of our Jetpack users. Our support team is always around to help you. </p>
						<p className="jp-support-card__description"><a className="jp-support-card__link" href="http://jetpack.com/support/" title="Go to Jetpack.com/support">View our support page</a><span className="jp-hidden-on-mobile">,</span> <a className="jp-support-card__link" href="https://wordpress.org/support/plugin/jetpack" title="Go to the WordPress.org support forums">check the forums for answers</a><span className="jp-hidden-on-mobile">, or </span><a className="jp-support-card__link" href="https://jetpack.com/contact-support/" title="Contact Jetpack support staff directly">contact us directly</a><span className="jp-hidden-on-mobile">.</span></p>
					</div>
				</Card>
				<Card className="jp-support-card__social">
					<p className="jp-support-card__description"><span className="jp-hidden-on-mobile">Enjoying Jetpack or have feedback? </span><a className="jp-support-card__link" href="https://wordpress.org/support/view/plugin-reviews/jetpack" title="Leave a Jetpack review" target="_blank">Leave us a review</a><span className="jp-hidden-on-mobile">, </span><a className="jp-support-card__link" href="http://twitter.com/jetpack" title="Follow Jetpack on Twitter" target="_blank">follow us on twitter</a><span className="jp-hidden-on-mobile">, or </span><a className="jp-support-card__link" href="https://www.facebook.com/jetpackme" title="Like us on facebook" target="_blank">like us on facebook</a><span className="jp-hidden-on-mobile">.</span></p>
				</Card>
			</div>
		);
	}
} );
