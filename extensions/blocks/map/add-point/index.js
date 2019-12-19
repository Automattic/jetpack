/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import { Component } from '@wordpress/element';
import { Button, Dashicon, Popover } from '@wordpress/components';

/**
 * Internal dependencies
 */
import './style.scss';
import LocationSearch from '../location-search';

export class AddPoint extends Component {
	render() {
		const { onClose, onAddPoint, onError, apiKey } = this.props;
		return (
			<Button className="component__add-point">
				{ __( 'Add marker', 'jetpack' ) }
				<Popover className="component__add-point__popover">
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
