/**
 * External dependencies
 */
import PropTypes from 'prop-types';
import React, { PureComponent } from 'react';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import ScreenReaderText from 'components/screen-reader-text';

export default class ProgressBar extends PureComponent {
	static defaultProps = {
		total: 100,
	};

	static propTypes = {
		value: PropTypes.number.isRequired,
		total: PropTypes.number,
		title: PropTypes.string,
		className: PropTypes.string,
	};

	render() {
		const classes = classnames( this.props.className, 'checklist-header-progress-bar' );
		const percentage = Math.min( Math.ceil( ( this.props.value / this.props.total ) * 100 ), 100 );
		const title = this.props.title ? (
			<ScreenReaderText>{ this.props.title }</ScreenReaderText>
		) : null;

		return (
			<div className={ classes }>
				<div
					className="checklist-header-progress-bar__progress"
					style={ { width: percentage + '%' } }
				>
					{ title }
				</div>
			</div>
		);
	}
}
