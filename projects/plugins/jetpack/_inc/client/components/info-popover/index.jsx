/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import createReactClass from 'create-react-class';
import { noop } from 'lodash';

/**
 * Internal dependencies
 */
import Popover from 'components/popover';
import Gridicon from 'components/gridicon';
import classNames from 'classnames';
import analytics from 'lib/analytics';

import './style.scss';

export default createReactClass( {
	displayName: 'InfoPopover',

	propTypes: {
		id: PropTypes.string,
		position: PropTypes.string,
		className: PropTypes.string,
		rootClassName: PropTypes.string,
		gaEventCategory: PropTypes.string,
		popoverName: PropTypes.string,
		onClick: PropTypes.func,
		ignoreContext: PropTypes.shape( {
			getDOMNode: PropTypes.function,
		} ),
	},

	getDefaultProps() {
		return {
			position: 'bottom',
			onClick: noop,
		};
	},

	getInitialState() {
		return {
			showPopover: false,
		};
	},

	render() {
		const classes = classNames(
			'dops-info-popover',
			'dops-info-popover-button',
			{ is_active: this.state.showPopover },
			this.props.className
		);
		return (
			<button ref="infoPopover" className={ classes } onClick={ this._onClick }>
				<Gridicon icon="info-outline" size={ 18 } />
				{ this.props.screenReaderText ? (
					<span className="screen-reader-text">{ this.props.screenReaderText }</span>
				) : (
					''
				) }
				<Popover
					id={ this.props.id }
					isVisible={ this.state.showPopover }
					context={ this.refs && this.refs.infoPopover }
					ignoreContext={ this.props.ignoreContext }
					position={ this.props.position }
					onClose={ this._onClose }
					className={ classNames( 'dops-info-popover__tooltip', this.props.className ) }
					rootClassName={ this.props.rootClassName }
				>
					{ this.props.children }
				</Popover>
			</button>
		);
	},

	_onClick( event ) {
		this.props.onClick();
		event.preventDefault();
		this.setState(
			{
				showPopover: ! this.state.showPopover,
			},
			this._recordStats
		);
	},

	_onClose() {
		this.setState( { showPopover: false }, this._recordStats );
	},

	_recordStats() {
		const { gaEventCategory, popoverName } = this.props;

		if ( gaEventCategory && popoverName ) {
			const dialogState = this.state.showPopover ? ' Opened' : ' Closed';
			analytics.ga.recordEvent( gaEventCategory, 'InfoPopover: ' + popoverName + dialogState );
		}
	},
} );
