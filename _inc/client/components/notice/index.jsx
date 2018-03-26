/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import classnames from 'classnames';
import noop from 'lodash/noop';
import onKeyDownCallback from 'utils/onkeydown-callback';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';

require( './style.scss' );

export default class SimpleNotice extends React.Component {
	static displayName = 'SimpleNotice';

	static defaultProps = {
		duration: 0,
		status: null,
		showDismiss: true,
		className: '',
		onDismissClick: noop
	};

	static propTypes = {
		// we should validate the allowed statuses
		status: PropTypes.string,
		showDismiss: PropTypes.bool,
		isCompact: PropTypes.bool,
		duration: PropTypes.number,
		text: PropTypes.oneOfType( [
			PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ),
			PropTypes.arrayOf( PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ) )
		] ),
		icon: PropTypes.string,
		className: PropTypes.string
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
		let icon;

		switch ( this.props.status ) {
			case 'is-info':
				icon = 'info';
				break;
			case 'is-success':
				icon = 'checkmark';
				break;
			case 'is-error':
				icon = 'notice';
				break;
			case 'is-warning':
				icon = 'notice';
				break;
			default:
				icon = 'info';
				break;
		}

		return icon;
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
			dismissText
		} = this.props;
		const classes = classnames( 'dops-notice', status, className, {
			'is-compact': isCompact,
			'is-dismissable': showDismiss,
		} );

		return (
			<div className={ classes }>
				<span className="dops-notice__icon-wrapper">
					<Gridicon className="dops-notice__icon" icon={ icon || this.getIcon() } size={ 24 } />
				</span>
				<span className="dops-notice__content">
					<span className="dops-notice__text">{ text ? text : children }</span>
				</span>
				{ text ? children : null }
				{ showDismiss && (
					<span role="button" onKeyDown={ onKeyDownCallback( onDismissClick ) } tabIndex="0" className="dops-notice__dismiss" onClick={ onDismissClick }>
						<Gridicon icon="cross" size={ 24 } />
						<span className="dops-notice__screen-reader-text screen-reader-text">
							{ dismissText }
						</span>
					</span>
				) }
			</div>
		);
	}
}
