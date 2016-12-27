/**
 * External dependencies
 */
import React from 'react';
import Gridicon from 'components/gridicon';

export const InlineExpand = React.createClass( {

	propTypes: {
		label: React.PropTypes.string.isRequired,
		icon: React.PropTypes.string,
		cardKey: React.PropTypes.string,
		expanded: React.PropTypes.bool,
		onClick: React.PropTypes.func,
		onClose: React.PropTypes.func,
		onOpen: React.PropTypes.func
	},

	getInitialState: function() {
		return {
			expanded: this.props.expanded
		};
	},

	getDefaultProps: function() {
		return {
			icon: '',
			onOpen: () => false,
			onClose: () => false,
			cardKey: '',
			expanded: false
		};
	},

	onClick: function() {
		if ( this.props.children ) {
			this.setState( { expanded: ! this.state.expanded } );
		}

		if ( this.props.onClick ) {
			this.props.onClick();
		}

		if ( this.state.expanded ) {
			this.props.onClose( this.props.cardKey );
		} else {
			this.props.onOpen( this.props.cardKey );
		}
	},

	render: function() {
		let isExpanded = this.state.expanded
				? ' is-expanded'
				: '',
			extraClasses = this.props.className
				? ' ' + this.props.className
				: '';
		return (
			<div className={ 'jp-inline-expand' + extraClasses + isExpanded }>
				{
					<a className="jp-inline-expand-action" onClick={ this.onClick }>
						{
							this.props.label
						}
						{
							this.props.icon
								? <Gridicon icon={ this.props.icon } size={ 16 } />
								: ''
						}
					</a>
				}
				{
					this.state.expanded
						? <div className="jp-inline-expand-content">
							{ this.props.children }
						  </div>
						: ''
				}
			</div>
		);
	}
} );

export default InlineExpand;
