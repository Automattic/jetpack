/** @ssr-ready **/

import classNames from 'classnames';
import Count from 'components/count';
import PropTypes from 'prop-types';
import React from 'react';

class SelectDropdownItem extends React.Component {
	static propTypes = {
		children: PropTypes.node.isRequired,
		path: PropTypes.string,
		selected: PropTypes.bool,
		onClick: PropTypes.func,
		count: PropTypes.number,
	};

	static defaultProps = {
		selected: false,
	};

	render() {
		const optionClassName = classNames( this.props.className, {
			'dops-select-dropdown__item': true,
			'is-selected': this.props.selected,
			'is-disabled': this.props.disabled,
		} );

		return (
			<li className="dops-select-dropdown__option">
				<a
					ref="itemLink"
					href={ this.props.path }
					className={ optionClassName }
					onClick={ this.props.disabled ? null : this.props.onClick }
					data-bold-text={ this.props.value || this.props.children }
					role="option"
					tabIndex={ 0 }
					aria-selected={ this.props.selected }
				>
					<span className="dops-select-dropdown__item-text">
						{ this.props.children }
						{ 'number' === typeof this.props.count && <Count count={ this.props.count } /> }
					</span>
				</a>
			</li>
		);
	}
}

export default SelectDropdownItem;
