/* eslint jsx-a11y/no-onchange: 0 */
/**
 * External dependencies
 */
import React from 'react';

import PureRenderMixin from 'react-pure-render/mixin';
import createReactClass from 'create-react-class';

/**
 * Internal dependencies
 */
import InfoPopover from 'components/info-popover';

const InfoPopoverExample = createReactClass( {
	displayName: 'InfoPopover',

	mixins: [ PureRenderMixin ],

	getInitialState: function () {
		return {
			popoverPosition: 'bottom left',
		};
	},

	render: function () {
		const id = 'example-select';
		return (
			<div>
				<label htmlFor={ id }>
					Position
					<select
						id={ id }
						value={ this.state.popoverPosition }
						onChange={ this._changePopoverPosition }
					>
						<option value="top">top</option>
						<option value="top left">top left</option>
						<option value="top right">top right</option>
						<option value="left">left</option>
						<option value="right">right</option>
						<option value="bottom">bottom</option>
						<option value="bottom left">bottom left</option>
						<option value="bottom right">bottom right</option>
					</select>
				</label>

				<br />

				<InfoPopover id="popover__info-popover-example" position={ this.state.popoverPosition }>
					Some informational text.
				</InfoPopover>
			</div>
		);
	},

	_changePopoverPosition: function ( event ) {
		this.setState( { popoverPosition: event.target.value } );
	},
} );

export default InfoPopoverExample;
