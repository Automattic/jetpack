/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import Gridicon from 'components/gridicon';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import onKeyDownCallback from 'utils/onkeydown-callback';

export class InlineExpand extends React.Component {
	static propTypes = {
		label: PropTypes.string.isRequired,
		icon: PropTypes.string,
		cardKey: PropTypes.string,
		disabled: PropTypes.bool,
		expanded: PropTypes.bool,
		onClick: PropTypes.func,
		onClose: PropTypes.func,
		onOpen: PropTypes.func,
	};

	static defaultProps = {
		icon: '',
		onOpen: () => false,
		onClose: () => false,
		cardKey: '',
		disabled: false,
		expanded: false,
	};

	state = {
		expanded: this.props.expanded,
	};

	onClick = () => {
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
	};

	render() {
		return (
			<div
				className={ classNames( 'jp-inline-expand', this.props.className, {
					'is-expanded': this.state.expanded,
				} ) }
			>
				{
					<a
						className="jp-inline-expand-action"
						role="button"
						tabIndex="0"
						onKeyDown={ onKeyDownCallback( this.onClick ) }
						onClick={ this.onClick }
					>
						{ this.props.label }
						{ this.props.icon && <Gridicon icon={ this.props.icon } size={ 16 } /> }
					</a>
				}
				{ this.state.expanded && (
					<div className="jp-inline-expand-content">{ this.props.children }</div>
				) }
			</div>
		);
	}
}

export default InlineExpand;
