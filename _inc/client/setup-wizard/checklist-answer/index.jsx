/**
 * External dependencies
 */
import classNames from 'classnames';
import PropTypes from 'prop-types';
import React, { Component } from 'react';

/**
 * Internal dependencies
 */
import Gridicon from 'components/gridicon';

import './style.scss';

class ChecklistAnswer extends Component {
	constructor( props ) {
		super( props );
		this.state = { checked: false, expanded: false, windowWidth: '' };
	}

	componentDidMount = () => {
		this.handleResize(); // Call this once on mount to initialize state.windowWidth
		window.addEventListener( 'resize', this.handleResize );
	};

	componentWillUnmount = () => {
		window.removeEventListener( 'resize', this.handleResize );
	};

	handleResize = () => {
		const windowWidth = window.innerWidth <= 660 ? 'small' : 'large';
		this.setState( { windowWidth } );
	};

	toggleCheckboxLargeWindow = () => {
		if ( 'small' === this.state.windowWidth ) {
			return;
		}

		this.setState( { checked: ! this.state.checked } );
	};

	toggleCheckboxSmallWindow = () => {
		if ( 'large' === this.state.windowWidth ) {
			return;
		}

		this.setState( { checked: ! this.state.checked } );
	};

	toggleExpanded = () => {
		this.setState( { expanded: ! this.state.expanded } );
	};

	render() {
		const { checked, expanded } = this.state;

		const smallWindow = 'small' === this.state.windowWidth;

		const chevronIcon = expanded ? 'chevron-up' : 'chevron-down';

		return (
			<div
				className={ classNames( 'jp-checklist-answer-container', { checked } ) }
				onClick={ this.toggleCheckboxLargeWindow }
				onKeyPress={ this.toggleCheckboxLargeWindow }
				role="checkbox"
				aria-checked={ checked }
				tabIndex={ smallWindow ? -1 : 0 }
			>
				<div className="jp-checklist-answer-checkbox-container">
					<input
						type="checkbox"
						onClick={ this.toggleCheckboxSmallWindow }
						onKeyPress={ this.toggleCheckboxSmallWindow }
						tabIndex={ smallWindow ? 0 : -1 }
						checked={ checked }
					/>
				</div>
				<div className="jp-checklist-answer-title">
					<p>{ this.props.title }</p>
				</div>
				<div
					className={ classNames( 'jp-checklist-answer-details', {
						expanded,
					} ) }
				>
					<p>{ this.props.details }</p>
				</div>
				<div
					className={ classNames( 'jp-checklist-answer-chevron-container', {
						expanded,
					} ) }
					onClick={ this.toggleExpanded }
					onKeyPress={ this.toggleExpanded }
					role="button"
					tabIndex={ smallWindow ? 0 : -1 }
				>
					<Gridicon icon={ chevronIcon } size={ 21 } />
				</div>
			</div>
		);
	}
}

ChecklistAnswer.propTypes = {
	title: PropTypes.string.isRequired,
	details: PropTypes.string.isRequired,
};

export { ChecklistAnswer };
