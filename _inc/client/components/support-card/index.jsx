/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';
import sample from 'lodash/sample';
import { translate as __ } from 'lib/mixins/i18n';

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
						<img src={ 'https://secure.gravatar.com/avatar/' + randomGravID } alt={ __( 'Jetpack Happiness Engineer' ) } className="jp-support-card__happiness-engineer-img" />
					</div>
					<div className="jp-support-card__happiness-contact">
						<h4 className="jp-support-card__header">
							{ __( 'Need help? The Jetpack team is here for you.' ) }
						</h4>
						<p className="jp-support-card__description">
							{ __( 'We offer free, full support to all of our Jetpack users. Our support team is always around to help you.' ) }
						</p>
						<p className="jp-support-card__description">
							<a className="jp-support-card__link" href="http://jetpack.com/support/" title={ __( 'Go to Jetpack.com/support' ) }>
								{ __( 'View our support page' ) }
							</a>
							<span className="jp-hidden-on-mobile">,</span>
							<a className="jp-support-card__link" href="https://wordpress.org/support/plugin/jetpack" title={ __( 'Go to the WordPress.org support forums' ) }>
								{ __( 'check the forums for answers' ) }
							</a>
							<span className="jp-hidden-on-mobile">, or </span>
							<a className="jp-support-card__link" href="https://jetpack.com/contact-support/" title={ __( 'Contact Jetpack support staff directly' ) }>
								{ __( 'contact us directly' ) }
							</a>
							<span className="jp-hidden-on-mobile">.</span></p>
					</div>
				</Card>
				<Card className="jp-support-card__social">
					<p className="jp-support-card__description">
						<span className="jp-hidden-on-mobile">{ __( 'Enjoying Jetpack or have feedback?' ) }</span>
						<a className="jp-support-card__link" href="https://wordpress.org/support/view/plugin-reviews/jetpack" title={ __( 'Leave a Jetpack review' ) } target="_blank">
							{ __( 'Leave us a review' ) }
						</a>
						<span className="jp-hidden-on-mobile">, </span>
						<a className="jp-support-card__link" href="http://twitter.com/jetpack" title={ __( 'Follow Jetpack on Twitter' ) } target="_blank">
							{ __( 'follow us on twitter' ) }
						</a>
						<span className="jp-hidden-on-mobile">, or </span>
						<a className="jp-support-card__link" href="https://www.facebook.com/jetpackme" title={ __( 'Like us on facebook' ) } target="_blank">
							{ __( 'like us on facebook' ) }
						</a>
						<span className="jp-hidden-on-mobile">.</span></p>
				</Card>
			</div>
		);
	}
} );
