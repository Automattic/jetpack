/**
 * External dependencies
 */
import * as React from 'react';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import ScreenReaderText from 'components/screen-reader-text';

/**
 * Style dependencies
 */
import './style.scss';

// NOTE: Adapted from wp-calypso's component/progress-bar
export default class ProgressBar extends React.PureComponent {
	static defaultProps = {
		total: 100,
		compact: false,
		isPulsing: false,
		canGoBackwards: false,
	};

	static getDerivedStateFromProps( props, state ) {
		return {
			allTimeMax: Math.max( state.allTimeMax, props.value ),
		};
	}

	state = {
		allTimeMax: this.props.value,
	};

	getCompletionPercentage() {
		const percentage = Math.ceil(
			( ( this.props.canGoBackwards ? this.props.value : this.state.allTimeMax ) /
				this.props.total ) *
				100
		);

		// The percentage should not be allowed to be more than 100
		return Math.min( percentage, 100 );
	}

	renderBar() {
		const { color, title, total, value } = this.props;

		const styles = { width: this.getCompletionPercentage() + '%' };
		if ( color ) {
			styles.backgroundColor = color;
		}

		return (
			<div
				aria-valuemax={ total }
				aria-valuemin={ 0 }
				aria-valuenow={ value }
				className="progress-bar__progress"
				role="progressbar"
				style={ styles }
			>
				{ title && <ScreenReaderText>{ title }</ScreenReaderText> }
			</div>
		);
	}

	render() {
		const classes = classnames( this.props.className, 'progress-bar', {
			'is-compact': this.props.compact,
			'is-pulsing': this.props.isPulsing,
		} );
		return <div className={ classes }>{ this.renderBar() }</div>;
	}
}
