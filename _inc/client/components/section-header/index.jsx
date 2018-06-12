/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Card from 'components/card';

require( './style.scss' );

export default class SectionHeader extends React.Component {
	static displayName = 'SectionHeader';

	static propTypes = {
		label: PropTypes.string,
		cardBadge: PropTypes.oneOfType( [
			PropTypes.string,
			PropTypes.element,
			PropTypes.object
		] )
	};

	static defaultProps = {
		label: '',
		cardBadge: ''
	};

	render() {
		const classes = classNames(
			this.props.className,
			'dops-section-header'
		);

		const maybeShowCardBadge = this.props.cardBadge !== ''
			? <span className="dops-section-header__card-badge">{ this.props.cardBadge }</span>
			: '';

		return (
			<Card compact className={ classNames( classes, { 'has-card-badge': this.props.cardBadge !== '' } ) }>
				<div className="dops-section-header__label">
					<span className="dops-section-header__label-text">{ this.props.label }</span>
					{ maybeShowCardBadge }
				</div>
				<div className="dops-section-header__actions">
					{ this.props.children }
				</div>
			</Card>
		);
	}
}
