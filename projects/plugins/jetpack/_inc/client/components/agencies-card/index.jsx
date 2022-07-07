import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import Button from 'components/button';
import Card from 'components/card';
import analytics from 'lib/analytics';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { isCurrentUserLinked, isConnectionOwner, connectUser } from 'state/connection';
import { isFetchingSiteData } from 'state/site';

class AgenciesCard extends Component {
	static defaultProps = {
		className: '',
	};

	trackLearnClick = () => {
		analytics.tracks.recordJetpackClick( {
			target: 'learn-more-click',
			feature: 'agencies',
			page: this.props.path,
			is_user_wpcom_connected: this.props.isCurrentUserLinked ? 'yes' : 'no',
			is_connection_owner: this.props.isConnectionOwner ? 'yes' : 'no',
		} );
	};

	render() {
		if ( this.props.isFetchingSiteData ) {
			return <div />;
		}

		const classes = classNames( this.props.className, 'jp-agencies-card' );

		return (
			<div className={ classes }>
				<Card className="jp-agencies-card__wrapper">
					<div className="jp-agencies-card__contact">
						<h3 className="jp-agencies-card__header">
							{ __( "Manage your clients' sites with ease", 'jetpack' ) }
						</h3>
						<p className="jp-agencies-card__description">
							{
								/* translators: % is just a percent sign, not a placeholder */
								__(
									'Monitor site and product activity, manage licenses, and get a 25% discount in our agency portal.',
									'jetpack'
								)
							}
						</p>
						<p className="jp-agencies-card__description">
							<Button
								onClick={ this.trackLearnClick }
								href="https://jetpack.com/for/agencies"
								target="_blank"
								rel="noreferrer"
							>
								{ __( 'Learn More', 'jetpack' ) }
							</Button>
						</p>
					</div>
				</Card>
			</div>
		);
	}
}

AgenciesCard.propTypes = {
	className: PropTypes.string,
	connectUser: PropTypes.func,
	isConnectionOwner: PropTypes.bool,
	isCurrentUserLinked: PropTypes.bool,
	isFetchingSiteData: PropTypes.bool,
	path: PropTypes.string,
};

export default connect(
	state => {
		return {
			isFetchingSiteData: isFetchingSiteData( state ),
			isCurrentUserLinked: isCurrentUserLinked( state ),
			isConnectionOwner: isConnectionOwner( state ),
		};
	},
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( AgenciesCard );
