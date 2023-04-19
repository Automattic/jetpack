import { ActionButton, Notice } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import PropTypes from 'prop-types';
import React from 'react';

export class ConnectionBanner extends React.Component {
	static propTypes = {
		title: PropTypes.string.isRequired,
		description: PropTypes.node,
		from: PropTypes.string,
	};

	handleClick() {
		let fromQuery = '';
		if ( this.props.from ) {
			fromQuery = '&from=' + encodeURIComponent( this.props.from );
		}

		window.location.href = '/wp-admin/admin.php?page=jetpack' + fromQuery + '#/connect-user';
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

export default ConnectionBanner;
