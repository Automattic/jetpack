import { Notice } from '@wordpress/ui';
import PropTypes from 'prop-types';
import { Component, isValidElement } from 'react';

const noop = () => {};

export default class SimpleNotice extends Component {
	static displayName = 'SimpleNotice';

	static defaultProps = {
		duration: 0,
		status: null,
		showDismiss: true,
		className: '',
		onDismissClick: noop,
		display: true,
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
		icon: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ),
		onDismissClick: PropTypes.func,
		className: PropTypes.string,
		display: PropTypes.bool,
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

	getIntent = () => {
		switch ( this.props.status ) {
			case 'is-info':
				return 'info';
			case 'is-success':
				return 'success';
			case 'is-error':
				return 'error';
			case 'is-warning':
				return 'warning';
			default:
				return 'neutral';
		}
	};

	clearText = text => {
		if ( 'string' === typeof text ) {
			return text.replace( /(<([^>]+)>)/gi, '' );
		}
		return text;
	};

	render() {
		const {
			children,
			className,
			icon,
			isCompact,
			onDismissClick,
			showDismiss = ! isCompact, // by default, show on normal notices, don't show on compact ones
			text,
			dismissText,
			display,
		} = this.props;

		if ( ! display ) {
			return null;
		}

		// `text` marks the caller as using the two-slot form, where children are the
		// actions. Without it, children are the body.
		const body = text ? this.clearText( text ) : children;
		const actions = text ? children : null;

		return (
			<Notice.Root
				intent={ this.getIntent() }
				className={ className }
				// Callers pass either a Gridicon name or an element; only elements work
				// here, and the intent already picks a sensible default icon.
				icon={ isValidElement( icon ) ? icon : undefined }
			>
				<Notice.Description>{ body }</Notice.Description>
				{ actions ? <Notice.Actions>{ actions }</Notice.Actions> : null }
				{ showDismiss && <Notice.CloseIcon label={ dismissText } onClick={ onDismissClick } /> }
			</Notice.Root>
		);
	}
}
