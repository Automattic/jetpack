/** @ssr-ready **/

/**
 * External Dependencies
 */
const PropTypes = require( 'prop-types' );
const React = require( 'react' ),
	classNames = require( 'classnames' );

/**
 * Internal dependencies
 */
const Count = require( 'components/count' );

class SelectDropdownItem extends React.Component {
	static propTypes = {
		children: PropTypes.string.isRequired,
		path: PropTypes.string,
		selected: PropTypes.bool,
		onClick: PropTypes.func,
		count: PropTypes.number
	};

	static defaultProps = {
		selected: false
	};

	render() {
		const optionClassName = classNames( this.props.className, {
			'dops-select-dropdown__item': true,
			'is-selected': this.props.selected,
			'is-disabled': this.props.disabled
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
					aria-selected={ this.props.selected } >
					<span className="dops-select-dropdown__item-text">
						{ this.props.children }
						{
							'number' === typeof this.props.count &&
							<Count count={ this.props.count } />
						}
					</span>
				</a>
			</li>
		);
	}
}

module.exports = SelectDropdownItem;
