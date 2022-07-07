import { __ } from '@wordpress/i18n';
import classNames from 'classnames';
import Card from 'components/card';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { connectUser } from 'state/connection';
import { isFetchingSiteData } from 'state/site';

class AgenciesCard extends Component {
	static displayName = 'AgenciesCard';

	static defaultProps = {
		className: '',
		siteConnectionStatus: false,
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
					</div>
				</Card>
			</div>
		);
	}
}

AgenciesCard.propTypes = {
	className: PropTypes.string,
	isFetchingSiteData: PropTypes.bool,
};

export default connect(
	state => {
		return {
			isFetchingSiteData: isFetchingSiteData( state ),
		};
	},
	dispatch => ( {
		connectUser: () => {
			return dispatch( connectUser() );
		},
	} )
)( AgenciesCard );
