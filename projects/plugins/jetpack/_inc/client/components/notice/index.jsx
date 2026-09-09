import { Notice } from '@wordpress/ui';
import clsx from 'clsx';
import PropTypes from 'prop-types';
import { Component } from 'react';

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
		title: PropTypes.oneOfType( [ PropTypes.string, PropTypes.node ] ),
		onDismissClick: PropTypes.func,
		dismissText: PropTypes.string,
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
			isCompact,
			onDismissClick,
			showDismiss = ! isCompact, // by default, show on normal notices, don't show on compact ones
			text,
			title,
			dismissText,
			display,
		} = this.props;

		// `text` marks the caller as using the two-slot form, where children are the
		// actions. Without it, children are the body.
		const body = text ? this.clearText( text ) : children;
		const actions = text ? children : null;

		return (
			<Notice.Root
				intent={ this.getIntent() }
				// `Notice.Root`'s own class is a CSS-module hash, so page styles need
				// `jp-notice`. `is-hidden` keeps `display` hiding the notice rather than
				// unmounting it: children like NoticeActionReconnect track on mount.
				className={ clsx( 'jp-notice', className, { 'is-hidden': ! display } ) }
				// The legacy notice never announced. Several of these are permanent, and
				// the ones that should announce already sit in an aria-live container.
				spokenMessage={ null }
			>
				{ title ? <Notice.Title>{ title }</Notice.Title> : null }
				{ ( body || body === 0 ) && (
					<Notice.Description render={ <div /> }>{ body }</Notice.Description>
				) }
				{ actions ? <Notice.Actions>{ actions }</Notice.Actions> : null }
				{ showDismiss && <Notice.CloseIcon label={ dismissText } onClick={ onDismissClick } /> }
			</Notice.Root>
		);
	}
}
