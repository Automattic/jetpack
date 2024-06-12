import clsx from 'clsx';
import Gridicon from 'components/gridicon';
import Popover from 'components/popover';
import analytics from 'lib/analytics';
import { noop } from 'lodash';
import PropTypes from 'prop-types';
import React from 'react';

import './style.scss';

export default class extends React.Component {
	static displayName = 'InfoPopover';

	static propTypes = {
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
	};

	static defaultProps = {
		position: 'bottom',
		onClick: noop,
	};

	infoPopoverRef = React.createRef();

	state = {
		showPopover: false,
	};

	render() {
		const classes = clsx(
			'dops-info-popover',
			'dops-info-popover-button',
			{ is_active: this.state.showPopover },
			this.props.className
		);
		return (
			<button ref={ this.infoPopoverRef } className={ classes } onClick={ this._onClick }>
				<Gridicon icon="info-outline" size={ 18 } />
				{ this.props.screenReaderText ? (
					<span className="screen-reader-text">{ this.props.screenReaderText }</span>
				) : (
					''
				) }
				<Popover
					id={ this.props.id }
					isVisible={ this.state.showPopover }
					context={ this.infoPopoverRef.current }
					ignoreContext={ this.props.ignoreContext }
					position={ this.props.position }
					onClose={ this._onClose }
					className={ clsx( 'dops-info-popover__tooltip', this.props.className ) }
					rootClassName={ this.props.rootClassName }
				>
					{ this.props.children }
				</Popover>
			</button>
		);
	}

	_onClick = event => {
		this.props.onClick();
		event.preventDefault();
		this.setState(
			{
				showPopover: ! this.state.showPopover,
			},
			this._recordStats
		);
	};

	_onClose = () => {
		this.setState( { showPopover: false }, this._recordStats );
	};

	_recordStats() {
		const { gaEventCategory, popoverName } = this.props;

		if ( gaEventCategory && popoverName ) {
			const dialogState = this.state.showPopover ? ' Opened' : ' Closed';
			analytics.ga.recordEvent( gaEventCategory, 'InfoPopover: ' + popoverName + dialogState );
		}
	}
}
