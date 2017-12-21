/**
* External dependencies
*/
import React from 'react';
import noop from 'lodash/noop';

/**
* Internal dependencies
*/
import Popover from 'components/popover';
import Gridicon from 'components/gridicon';
import classNames from 'classnames';
import analytics from 'lib/analytics';

require( './style.scss' );

export default React.createClass( {

	displayName: 'InfoPopover',

	propTypes: {
		id: React.PropTypes.string,
		position: React.PropTypes.string,
		className: React.PropTypes.string,
		rootClassName: React.PropTypes.string,
		gaEventCategory: React.PropTypes.string,
		popoverName: React.PropTypes.string,
		onClick: React.PropTypes.func,
		ignoreContext: React.PropTypes.shape( {
			getDOMNode: React.PropTypes.function
		} ),
	},

	getDefaultProps() {
		return {
			position: 'bottom',
			onClick: noop
		};
	},

	getInitialState() {
		return {
			showPopover: false
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
				{
					this.props.screenReaderText
						? <span className="screen-reader-text">{ this.props.screenReaderText }</span>
						: ''
				}
				<Popover
					id={ this.props.id }
					isVisible={ this.state.showPopover }
					context={ this.refs && this.refs.infoPopover }
					ignoreContext={ this.props.ignoreContext }
					position={ this.props.position }
					onClose={ this._onClose }
					className={ classNames(
							'dops-info-popover__tooltip',
							this.props.className
						) }
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
		this.setState( {
			showPopover: ! this.state.showPopover },
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
	}
} );
