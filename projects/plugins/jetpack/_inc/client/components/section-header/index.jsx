import classNames from 'classnames';
import Card from 'components/card';
import React from 'react';

import './style.scss';

export default class SectionHeader extends React.Component {
	static displayName = 'SectionHeader';

	static defaultProps = {
		label: '',
	};

	render() {
		const classes = classNames( this.props.className, 'dops-section-header' );

		return (
			<Card compact className={ classes }>
				<div className="dops-section-header__label">
					<span className="dops-section-header__label-text">{ this.props.label }</span>
				</div>
				<div className="dops-section-header__actions">{ this.props.children }</div>
			</Card>
		);
	}
}
