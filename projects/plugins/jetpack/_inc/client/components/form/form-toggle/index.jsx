/* eslint-disable jsx-a11y/click-events-have-key-events */
/* eslint-disable jsx-a11y/no-static-element-interactions */

import clsx from 'clsx';
import Popover from 'components/popover';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

import './style.scss';

export default class FormToggle extends Component {
	static propTypes = {
		onChange: PropTypes.func,
		onKeyDown: PropTypes.func,
		checked: PropTypes.bool,
		disabled: PropTypes.bool,
		id: PropTypes.string,
		className: PropTypes.string,
		toggling: PropTypes.bool,
		'aria-label': PropTypes.string,
		children: PropTypes.node,
		disabledReason: PropTypes.node,
	};

	static defaultProps = {
		checked: false,
		disabled: false,
		onKeyDown: () => {},
		onChange: () => {},
		disabledPopoverPosition: 'bottom',
		disabledReason: '',
	};

	toggleSwitchRef = React.createRef();

	state = {
		showPopover: false,
	};

	static idNum = 0;

	constructor() {
		super( ...arguments );

		this.onKeyDown = this.onKeyDown.bind( this );
		this.onClick = this.onClick.bind( this );
		this.onLabelClick = this.onLabelClick.bind( this );
	}

	togglePopover = () => {
		this.setState( { showPopover: ! this.state.showPopover } );
	};

	_onPopoverClose = () => {
		this.setState( { showPopover: false } );
	};

	UNSAFE_componentWillMount() {
		this.id = this.constructor.idNum++;
	}

	onKeyDown( event ) {
		if ( this.props.disabled ) {
			return;
		}

		if ( event.key === 'Enter' || event.key === ' ' ) {
			event.preventDefault();
			this.props.onChange();
		}

		this.props.onKeyDown( event );
	}

	onClick() {
		if ( ! this.props.disabled ) {
			this.props.onChange();
		} else if ( this.props.disabledReason ) {
			this.togglePopover();
		}
	}

	onLabelClick( event ) {
		if ( this.props.disabled ) {
			return;
		}

		const nodeName = event.target.nodeName.toLowerCase();
		if ( nodeName !== 'a' && nodeName !== 'input' && nodeName !== 'select' ) {
			event.preventDefault();
			this.props.onChange();
		}
	}

	renderPopover = () => {
		return (
			<Popover
				isVisible={ this.state.showPopover }
				context={ this.toggleSwitchRef.current }
				position={ this.props.disabledPopoverPosition }
				onClose={ this._onPopoverClose }
				className="dops-info-popover__tooltip"
			>
				{ this.props.disabledReason }
			</Popover>
		);
	};

	render() {
		const id = this.props.id || 'toggle-' + this.id;
		const toggleClasses = clsx( 'form-toggle', this.props.className, {
			'is-toggling': this.props.toggling,
		} );

		return (
			<span>
				<input
					className={ toggleClasses }
					type="checkbox"
					checked={ this.props.checked }
					readOnly={ true }
					disabled={ this.props.disabled }
				/>
				<label className="form-toggle__label" htmlFor={ id }>
					<span
						className="form-toggle__switch"
						disabled={ this.props.disabled }
						id={ id }
						onClick={ this.onClick }
						onKeyDown={ this.onKeyDown }
						role="checkbox"
						aria-checked={ this.props.checked }
						aria-label={ this.props[ 'aria-label' ] }
						tabIndex={ this.props.disabled ? -1 : 0 }
						ref={ this.toggleSwitchRef }
					/>
					<span className="form-toggle__label-content" onClick={ this.onLabelClick }>
						{ this.props.children }
					</span>
				</label>
				{ this.renderPopover() }
			</span>
		);
	}
}
