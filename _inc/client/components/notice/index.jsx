/**
 * External dependencies
 */
import React, { PropTypes } from 'react';
import classnames from 'classnames';
import noop from 'lodash/noop';
import onKeyDownCallback from 'utils/onkeydown-callback';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';

require( './style.scss' );

export default React.createClass( {
	displayName: 'SimpleNotice',
	dismissTimeout: null,

	getDefaultProps() {
		return {
			duration: 0,
			status: null,
			showDismiss: true,
			className: '',
			onDismissClick: noop
		};
	},

	propTypes: {
		// we should validate the allowed statuses
		status: PropTypes.string,
		showDismiss: PropTypes.bool,
		isCompact: PropTypes.bool,
		duration: React.PropTypes.number,
		text: PropTypes.oneOfType( [
			PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ),
			PropTypes.arrayOf( PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ) )
		] ),
		icon: PropTypes.string,
		className: PropTypes.string
	},

	componentDidMount() {
		if ( this.props.duration > 0 ) {
			this.dismissTimeout = setTimeout( this.props.onDismissClick, this.props.duration );
		}
	},

	componentWillUnmount() {
		if ( this.dismissTimeout ) {
			clearTimeout( this.dismissTimeout );
		}
	},

	getIcon() {
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
	},

	render() {
		const { status, className, isCompact, showDismiss } = this.props;
		const classes = classnames( 'dops-notice', status, className, {
			'is-compact': isCompact,
			'is-dismissable': showDismiss
		} );

		const { icon, text, children, onDismissClick, dismissText } = this.props;

		return (
			<div className={ classes }>
				<Gridicon className="dops-notice__icon" icon={ icon || this.getIcon() } size={ 24 } />
				<span className="dops-notice__content">
					<span className="dops-notice__text">
						{ text ? text : children }
					</span>
				</span>
				{ text ? children : null }
				{ showDismiss && (
					<span
						role="button"
						tabIndex="0"
						onClick={ onDismissClick }
						onKeyDown={ onKeyDownCallback( onDismissClick ) }
						className="dops-notice__dismiss">
						<Gridicon icon="cross" size={ 24 } />
						<span className="screen-reader-text">{ dismissText }</span>
					</span>
				) }
			</div>
		);
	}
} );
