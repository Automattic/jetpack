/**
 * External dependencies
 */
import React from 'react';
import { connect } from 'react-redux';
import classNames from 'classnames';
import sample from 'lodash/sample';
import Button from 'components/button';
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
						<p className="jp-support-card__buttons">
							<Button href="https://jetpack.com/contact-support/">
								{ __( 'Contact Support' ) }
							</Button>
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
