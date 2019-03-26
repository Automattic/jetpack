/**
 * External Dependencies
 */
import PropTypes from 'prop-types';

import React from 'react';
import classNames from 'classnames';

/**
 * Internal Dependencies
 */
import SegmentedControl from 'components/segmented-control';

import ControlItem from 'components/segmented-control/item';

/**
 * Internal variables
 */
let _instance = 1;

class NavSegmented extends React.Component {
	static propTypes = {
		label: PropTypes.string,
		hasSiblingControls: PropTypes.bool,
	};

	static defaultProps = {
		hasSiblingControls: false,
	};

	UNSAFE_componentWillMount() {
		this.id = _instance;
		_instance++;
	}

	render() {
		const segmentedClassName = classNames( {
			'dops-section-nav-group': true,
			'dops-section-nav__segmented': true,
			'has-siblings': this.props.hasSiblingControls,
		} );

		return (
			<div className={ segmentedClassName }>
				{ this.props.label && (
					<h6 className="dops-section-nav-group__label">{ this.props.label }</h6>
				) }

				<SegmentedControl>{ this.getControlItems() }</SegmentedControl>
			</div>
		);
	}

	getControlItems = () => {
		return React.Children.map(
			this.props.children,
			function( child, index ) {
				return (
					<ControlItem { ...child.props } key={ 'navSegmented-' + this.id + '-' + index }>
						{ child.props.children }
					</ControlItem>
				);
			},
			this
		);
	};
}

module.exports = NavSegmented;
