/**
 * External dependencies
 */
import React from 'react';
import classNames from 'classnames';

/**
 * Internal dependencies
 */
import Card from 'components/card';
import CompactCard from 'components/card/compact';

export default React.createClass( {
	displayName: 'ExpandedCard',

	propTypes: {
		header: React.PropTypes.string,
		summary: React.PropTypes.string
	},

	render() {
		const classes = classNames(
			this.props.className,
			'jp-expanded-card'
		);

		return (

			<div className={ classes }>
				<CompactCard>
					<div className="jp-expanded-card__header">
						{ this.props.header }
					</div>
					<div className="jp-expanded-card__summary">
						{ this.props.summary }
					</div>
				</CompactCard>
				<Card>
					{ this.props.children }
				</Card>
			</div>
		);
	}
} );
