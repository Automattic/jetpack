/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import sample from 'lodash/sample';
import { translate as __ } from 'i18n-calypso';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import { getHappinessGravatarIds } from 'state/initial-state';

const SupportCard = React.createClass( {
	displayName: 'SupportCard',

	render() {
		const classes = classNames(
			this.props.className,
			'jp-support-card'
		);

		const randomGravID = sample( this.props.happinessGravatarIds );

		return (
			<div className={ classes }>
				<Card className="jp-support-card__happiness">
					<div className="jp-support-card__happiness-contact">
						<h4 className="jp-support-card__header">
							{ __( 'Need help? The Jetpack team is here for you.' ) }
						</h4>
						<p className="jp-support-card__description">
							{ __( 'We offer free, full support to all of our Jetpack users. Our support team is always around to help you.' ) }
						</p>
						<p className="jp-support-card__description">
							{ __(
								'{{supportLink}}View our support page{{/supportLink}}{{hideOnMobile}},{{/hideOnMobile}} ' +
								'{{forumLink}}check the forums for answers{{/forumLink}}{{hideOnMobile}}, or{{/hideOnMobile}} ' +
								'{{contactLink}}contact us directly{{/contactLink}}{{hideOnMobile}}.{{/hideOnMobile}}', {
									components: {
										hideOnMobile: <span className="jp-hidden-on-mobile" />,
										supportLink: (
											<a
												className="jp-support-card__link"
												href="https://jetpack.com/support/"
												title={ __( 'Go to Jetpack.com/support' ) }
											/>
										),
										forumLink: (
											<a
												className="jp-support-card__link"
												href="https://wordpress.org/support/plugin/jetpack"
												title={ __( 'Go to the WordPress.org support forums' ) }
											/>
										),
										contactLink: (
											<a
												className="jp-support-card__link"
												href="https://jetpack.com/contact-support/"
												title={ __( 'Contact Jetpack support staff directly' ) }
											/>
										)
									}
								}
							) }
						</p>
					</div>
				</Card>
			</div>
		);
	}
} );

SupportCard.propTypes = {
	className: React.PropTypes.string,
	happinessGravatarIds: React.PropTypes.array.isRequired
};

export default connect(
	state => {
		return {
			happinessGravatarIds: getHappinessGravatarIds( state )
		}
	}
)( SupportCard );
