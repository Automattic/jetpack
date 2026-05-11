import { Icon, external as externalIcon } from '@wordpress/icons';
import PropTypes from 'prop-types';
import { Component } from 'react';

import './style.scss';

export default class NoticeAction extends Component {
	static displayName = 'NoticeAction';

	static propTypes = {
		href: PropTypes.string,
		onClick: PropTypes.func,
		external: PropTypes.bool,
	};

	static defaultProps = {
		external: false,
	};

	render() {
		const attributes = {
			className: 'dops-notice__action',
			href: this.props.href,
			onClick: this.props.onClick,
		};

		if ( this.props.external ) {
			attributes.target = '_blank';
		}

		return (
			<a { ...attributes }>
				<span>{ this.props.children }</span>
				{ this.props.external && <Icon icon={ externalIcon } size={ 24 } /> }
			</a>
		);
	}
}
