/**
 * External dependencies
 */
import React from 'react';
import Gridicon from 'components/gridicon';
import classNames from 'classnames';

export const InlineExpand = React.createClass( {

	propTypes: {
		label: React.PropTypes.string.isRequired,
		icon: React.PropTypes.string,
		cardKey: React.PropTypes.string,
		disabled: React.PropTypes.bool,
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
			disabled: false,
			expanded: false
		};
	},

	onClick: function() {
		if ( ! this.props.disabled ) {
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
		}
	},

	render: function() {
		return (
			<div className={ classNames( 'jp-inline-expand', this.props.className, { 'is-expanded': this.state.expanded } ) }>
				{
					<a className="jp-inline-expand-action" onClick={ this.onClick }>
						{
							this.props.label
						}
						{
							this.props.icon && (
								<Gridicon icon={ this.props.icon } size={ 16 } />
							)
						}
					</a>
				}
				{
					this.state.expanded && (
						<div className="jp-inline-expand-content">
							{ this.props.children }
						</div>
					)
				}
			</div>
		);
	}
} );

export default InlineExpand;
