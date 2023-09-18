import { ActionButton, Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';
import { connect } from 'react-redux';
import { connectUser as _connectUser } from 'state/connection';

export class ConnectionBanner extends React.Component {
	static propTypes = {
		title: PropTypes.string.isRequired,
		description: PropTypes.node,
		from: PropTypes.string,
	};

	handleClick() {
		this.props.doConnectUser( null, this.props.from );
	}

	render() {
		const { description, title } = this.props;

		const connectButtonProps = {
			label: __( 'Connect your WordPress.com account', 'jetpack' ),
			onClick: () => this.handleClick(),
		};

		return (
			<Notice
				title={ title }
				hideCloseButton
				actions={ [ <ActionButton { ...connectButtonProps } /> ] }
			>
				{ description }
			</Notice>
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
