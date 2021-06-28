/**
 * External dependencies
 */
import React from 'react';

/**
 * Internal dependencies
 */
import './rna-styles.scss';
import './stat-block-style.scss';

class StatBlock extends React.Component {
	render() {
		return (
			<div className="backup__card">
				<img src={ this.props.icon } alt="" />
				<div className="backup__card-details">
					<div className="backup__card-details-items">{ this.props.label }</div>
					<div className="backup__card-details-amount">{ this.props.value }</div>
				</div>
			</div>
		);
	}
}

export default StatBlock;
