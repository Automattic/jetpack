/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';

export default React.createClass( {
	displayName: 'SupportCard',

	render() {
		const classes = classNames(
			this.props.className,
			'jp-support-card'
		);

		return (
			<div className={ classes }>
				<div className="jp-support-card__happiness">
				testing happiness
				</div>
				<div className="jp-support-card__social">
				testing social
				</div>
			</div>
		);
	}
} );