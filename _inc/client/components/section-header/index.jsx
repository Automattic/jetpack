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
import Gridicon from 'components/gridicon';

import './style.scss';

export default class SectionHeader extends React.Component {
	static displayName = 'SectionHeader';

	static propTypes = {
		label: PropTypes.string,
		devModeWarning: PropTypes.bool,
	};

	static defaultProps = {
		label: '',
		devModeWarning: false,
	};

	render() {
		const classes = classNames( this.props.className, 'dops-section-header' );
		const { label, devModeWarning } = this.props;

		return (
			<Card compact className={ classes }>
				<div className="dops-section-header__label">
					{ devModeWarning ? <Gridicon icon="notice" /> : null }
					<span className="dops-section-header__label-text">
						{ label +
							( devModeWarning
								? ' — This feature is available in Development Mode, but may not be as fully functional as on a live site'
								: '' ) }
					</span>
				</div>
				<div className="dops-section-header__actions">{ this.props.children }</div>
			</Card>
		);
	}
}
