import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import PropTypes from 'prop-types';
import { Component } from 'react';
import { connect } from 'react-redux';
import { connectUser as _connectUser } from 'state/connection';

export class ConnectionBanner extends Component {
	static propTypes = {
		title: PropTypes.string.isRequired,
		description: PropTypes.node,
		from: PropTypes.string,
	};

	handleClick = () => {
		this.props.doConnectUser( null, this.props.from );
	};

	render() {
		const { description, title } = this.props;

		return (
			<Notice.Root intent="info">
				<Notice.Title>{ title }</Notice.Title>
				<Notice.Description>{ description }</Notice.Description>
				<Notice.Actions>
					<Notice.ActionButton onClick={ this.handleClick }>
						{ __( 'Connect your WordPress.com account', 'jetpack' ) }
					</Notice.ActionButton>
				</Notice.Actions>
			</Notice.Root>
		);
	}
}

export default connect(
	state => state,
	dispatch => {
		return {
			doConnectUser: ( featureLabel, from ) => dispatch( _connectUser( featureLabel, from ) ),
		};
	}
)( ConnectionBanner );
