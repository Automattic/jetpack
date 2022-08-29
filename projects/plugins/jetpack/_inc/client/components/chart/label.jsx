import PropTypes from 'prop-types';
import React from 'react';

export default class ModuleChartLabel extends React.Component {
	static displayName = 'ModuleChartLabel';

	static propTypes = {
		width: PropTypes.number.isRequired,
		x: PropTypes.number.isRequired,
		label: PropTypes.string.isRequired,
	};

	render() {
		const dir = 'left';
		const labelStyle = {
			width: this.props.width + 'px',
		};

		labelStyle[ dir ] = this.props.x + 'px';

		return (
			<div className="dops-chart__x-axis-label" style={ labelStyle }>
				{ this.props.label }
			</div>
		);
	}
}
