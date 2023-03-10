import { Button, Dashicon, Popover } from '@wordpress/components';
import { Component } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import LocationSearch from '../location-search';

import './style.scss';

export class AddPoint extends Component {
	render() {
		const { onClose, onAddPoint, onError, apiKey } = this.props;
		return (
			<Button className="component__add-point">
				{ __( 'Add marker', 'jetpack' ) }
				<Popover className="component__add-point__popover" position="bottom center">
					<Button className="component__add-point__close" onClick={ onClose }>
						<Dashicon icon="no" />
					</Button>
					<LocationSearch
						onAddPoint={ onAddPoint }
						label={ __( 'Add a location', 'jetpack' ) }
						apiKey={ apiKey }
						onError={ onError }
					/>
				</Popover>
			</Button>
		);
	}
}

AddPoint.defaultProps = {
	onAddPoint: () => {},
	onClose: () => {},
	onError: () => {},
};

export default AddPoint;
