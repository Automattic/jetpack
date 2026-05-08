import { Icon, info, check, caution, close } from '@wordpress/icons';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { Component } from 'react';

import './style.scss';

const noop = () => {};

export default class SimpleNotice extends Component {
	static displayName = 'SimpleNotice';

	static defaultProps = {
		duration: 0,
		status: null,
		showDismiss: true,
		className: '',
		onDismissClick: noop,
	};

	static propTypes = {
		// we should validate the allowed statuses
		status: PropTypes.string,
		showDismiss: PropTypes.bool,
		isCompact: PropTypes.bool,
		duration: PropTypes.number,
		text: PropTypes.oneOfType( [
			PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ),
			PropTypes.arrayOf( PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ) ),
		] ),
		icon: PropTypes.object,
		onDismissClick: PropTypes.func,
		className: PropTypes.string,
	};

	dismissTimeout = null;

	componentDidMount() {
		if ( this.props.duration > 0 ) {
			this.dismissTimeout = setTimeout( this.props.onDismissClick, this.props.duration );
		}
	}

	componentWillUnmount() {
		if ( this.dismissTimeout ) {
			clearTimeout( this.dismissTimeout );
		}
	}

	getIcon = () => {
		switch ( this.props.status ) {
			case 'is-success':
				return check;
			case 'is-error':
			case 'is-warning':
				return caution;
			case 'is-info':
			default:
				return info;
		}
	};

	clearText = text => {
		if ( 'string' === typeof text ) {
			return text.replace( /(<([^>]+)>)/gi, '' );
		}
		return text;
	};

	onKeyDownCallback = callback => event => {
		if ( event.which === 13 || event.which === 32 ) {
			callback && callback( event );
		}
	};

	render() {
		const {
			children,
			className,
			icon,
			isCompact,
			onDismissClick,
			showDismiss = ! isCompact, // by default, show on normal notices, don't show on compact ones
			status,
			text,
			dismissText,
		} = this.props;
		const classes = clsx( 'dops-notice', status, className, {
			'is-compact': isCompact,
			'is-dismissable': showDismiss,
		} );

		return (
			<div className={ classes }>
				<span className="dops-notice__icon-wrapper">
					<Icon className="dops-notice__icon" icon={ icon || this.getIcon() } size={ 24 } />
				</span>
				<span className="dops-notice__content">
					<span className="dops-notice__text">{ text ? this.clearText( text ) : children }</span>
				</span>
				{ text ? children : null }
				{ showDismiss && (
					<span
						role="button"
						onKeyDown={ this.onKeyDownCallback( onDismissClick ) }
						tabIndex="0"
						className="dops-notice__dismiss"
						onClick={ onDismissClick }
					>
						<Icon icon={ close } size={ 24 } />
						<span className="dops-notice__screen-reader-text screen-reader-text">
							{ dismissText }
						</span>
					</span>
				) }
			</div>
		);
	}
}
