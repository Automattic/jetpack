import PropTypes from 'prop-types';
import { Component } from 'react';
import Gridicon from 'components/gridicon';

import './style.scss';

export default class NoticeAction extends Component {
	static displayName = 'NoticeAction';

	static propTypes = {
		href: PropTypes.string,
		onClick: PropTypes.func,
		external: PropTypes.bool,
		icon: PropTypes.string,
		variant: PropTypes.oneOf( [ 'primary', 'secondary' ] ),
	};

	static defaultProps = {
		external: false,
	};

	render() {
		let className = 'dops-notice__action';
		if ( this.props.variant === 'secondary' ) {
			className += ' is-secondary';
		}

		const attributes = {
			className,
			href: this.props.href,
			onClick: this.props.onClick,
		};

		if ( this.props.external ) {
			attributes.target = '_blank';
		}

		return (
			<a { ...attributes }>
				<span>{ this.props.children }</span>
				{ this.props.icon && <Gridicon icon={ this.props.icon } size={ 24 } /> }
				{ this.props.external && <Gridicon icon="external" size={ 24 } /> }
			</a>
		);
	}
}
