/* eslint jsx-a11y/no-onchange: 0 */
import InfoPopover from 'components/info-popover';
import React from 'react';

class InfoPopoverExample extends React.PureComponent {
	static displayName = 'InfoPopover';

	state = {
		popoverPosition: 'bottom left',
	};

	render() {
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
	}

	_changePopoverPosition = event => {
		this.setState( { popoverPosition: event.target.value } );
	};
}

export default InfoPopoverExample;
