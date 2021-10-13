/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Component, createRef, Fragment } from '@wordpress/element';
import {
	Button,
	ExternalLink,
	Placeholder,
	Spinner,
	withNotices,
	ResizableBox,
} from '@wordpress/components';
import { BlockControls, InspectorControls } from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import AddPoint from './add-point';
import Map from './component.js';
import Controls from './controls';
import { settings } from './settings.js';
import previewPlaceholder from './map-preview.jpg';
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { getActiveStyleName } from '../../shared/block-styles';

const API_STATE_LOADING = 0;
const API_STATE_FAILURE = 1;
const API_STATE_SUCCESS = 2;

// The minimum height that the map can be set to.
const MIN_HEIGHT = 400;

// Options for the map <ResizableBox> wrapper.
const RESIZABLE_BOX_ENABLE_OPTION = {
	top: false,
	right: false,
	bottom: true,
	left: false,
	topRight: false,
	bottomRight: false,
	bottomLeft: false,
	topLeft: false,
};
class MapEdit extends Component {
	constructor() {
		super( ...arguments );
		this.state = {
			addPointVisibility: false,
			apiState: API_STATE_LOADING,
		};
		this.mapRef = createRef();

		//console.log( 'I am constructing' );

		// Maybe check for existence for address prop
		// and resolve the coordinates (call the helper function)
		// and add to the pointsList (setAttributes(...atributes, { pointsList })
		// Question 1: Is constructor the right place to do this?
		// Question 2: What is that apiState API_STATE_LOADING above mean? Does it mean that API keys might not exist during construct stage?
		// Fallback considerations: If there is no apiKey (self hosted), don't do anything perhaps.
		const { attributes, setAttributes } = this.props;
		const { address } = attributes;
		if ( address ) {
			//console.log( attributes );
			//console.log( 'Address: ' + address );
			const newPoint = [
				{
					title: 'title goes here',
					placeTitle: 'placeTitle goes here',
					caption: 'caption goes here',
					coordinates: {
						latitude: 44.14472,
						longitude: 17.11278,
					},
				},
			];
			setAttributes( { points: newPoint } );
			//this.addPoint(newPoint);
		}
	}

	addPoint = point => {
		const { attributes, setAttributes } = this.props;
		const { points } = attributes;
		const newPoints = points.slice( 0 );
		let duplicateFound = false;
		points.map( existingPoint => {
			if ( existingPoint.id === point.id ) {
				duplicateFound = true;
			}
		} );
		if ( duplicateFound ) {
			return;
		}
		newPoints.push( point );
		setAttributes( { points: newPoints } );
		this.setState( { addPointVisibility: false } );
	};
	setPointVisibility = () => {
		this.setState( { addPointVisibility: true } );
	};
	updateAPIKeyControl = event => {
		this.setState( {
			apiKeyControl: event.target.value,
		} );
	};
	updateAPIKey = () => {
		const { noticeOperations } = this.props;
		const { apiKeyControl } = this.state;
		noticeOperations.removeAllNotices();
		apiKeyControl && this.apiCall( apiKeyControl, 'POST' );
	};
	removeAPIKey = () => {
		this.apiCall( null, 'DELETE' );
	};
	apiCall( serviceApiKey = null, method = 'GET' ) {
		const { noticeOperations } = this.props;
		const path = '/wpcom/v2/service-api-keys/mapbox';
		const fetch = serviceApiKey
			? { path, method, data: { service_api_key: serviceApiKey } }
			: { path, method };
		this.setState( { apiRequestOutstanding: true }, () => {
			apiFetch( fetch ).then(
				( { service_api_key: apiKey, service_api_key_source: apiKeySource } ) => {
					noticeOperations.removeAllNotices();

					const apiState = apiKey ? API_STATE_SUCCESS : API_STATE_FAILURE;
					const apiKeyControl = 'wpcom' === apiKeySource ? '' : apiKey;

					this.setState( {
						apiState,
						apiKey,
						apiKeyControl,
						apiKeySource,
						apiRequestOutstanding: false,
					} );
				},
				( { message } ) => {
					this.onError( null, message );
					this.setState( {
						apiState: API_STATE_FAILURE,
						apiRequestOutstanding: false,
					} );
				}
			);
		} );
	}
	componentDidMount() {
		this.apiCall();
	}
	onError = ( code, message ) => {
		const { noticeOperations } = this.props;
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( message );
	};

	/**
	 * Event handler for the ResizableBox component. Updates both the height attribute,
	 * and the map component's height in the DOM.
	 *
	 * @param {Event} event - The event object.
	 * @param {string} direction - A string representing which resize handler was used.
	 * @param {HTMLElement} elt - A ref to the ResizeableBox's container element.
	 * @param {object} delta - Information about how far the element was resized.
	 */
	onMapResize = ( event, direction, elt, delta ) => {
		const { onResizeStop, setAttributes } = this.props;

		onResizeStop();

		const height = parseInt( this.mapRef.current.mapRef.current.offsetHeight + delta.height, 10 );

		setAttributes( {
			mapHeight: height,
		} );

		setTimeout( this.mapRef.current.sizeMap, 0 );
	};

	render() {
		const {
			className,
			setAttributes,
			attributes,
			noticeUI,
			notices,
			isSelected,
			instanceId,
			onResizeStart,
		} = this.props;
		const {
			mapDetails,
			points,
			zoom,
			mapCenter,
			markerColor,
			preview,
			mapHeight,
			showFullscreenButton,
		} = attributes;
		const {
			addPointVisibility,
			apiKey,
			apiKeyControl,
			apiState,
			apiRequestOutstanding,
		} = this.state;
		const inspectorControls = (
			<>
				<BlockControls>
					<Controls
						attributes={ attributes }
						setAttributes={ setAttributes }
						state={ this.state }
						setPointVisibility={ this.setPointVisibility }
						context="toolbar"
						mapRef={ this.mapRef }
					/>
				</BlockControls>
				<InspectorControls>
					<Controls
						attributes={ attributes }
						setAttributes={ setAttributes }
						state={ this.state }
						setState={ this.setState }
						mapRef={ this.mapRef }
						instanceId={ instanceId }
						minHeight={ MIN_HEIGHT }
						removeAPIKey={ this.removeAPIKey }
						updateAPIKey={ this.updateAPIKey }
					/>
				</InspectorControls>
			</>
		);
		const placholderAPIStateLoading = (
			<Placeholder icon={ settings.icon }>
				<Spinner />
			</Placeholder>
		);

		const instructions = (
			<Fragment>
				{ __( 'To use the map block, you need an Access Token.', 'jetpack' ) }
				<br />
				<ExternalLink href="https://www.mapbox.com">
					{ __( 'Create an account or log in to Mapbox.', 'jetpack' ) }
				</ExternalLink>
				<br />
				{ __(
					'Locate and copy the default access token. Then, paste it into the field below.',
					'jetpack'
				) }
			</Fragment>
		);
		const placeholderAPIStateFailure = (
			<Placeholder
				icon={ settings.icon }
				label={ __( 'Map', 'jetpack' ) }
				notices={ notices }
				instructions={ instructions }
			>
				<Fragment>
					<form>
						<input
							type="text"
							className="components-placeholder__input"
							disabled={ apiRequestOutstanding }
							placeholder={ __( 'Paste Token Here', 'jetpack' ) }
							value={ apiKeyControl }
							onChange={ this.updateAPIKeyControl }
						/>
						<Button
							isSecondary
							disabled={ apiRequestOutstanding || ! apiKeyControl || apiKeyControl.length < 1 }
							onClick={ this.updateAPIKey }
						>
							{ __( 'Set Token', 'jetpack' ) }
						</Button>
					</form>
				</Fragment>
			</Placeholder>
		);
		// Only scroll to zoom when the block is selected, and there's 1 or less points.
		const allowScrollToZoom = isSelected && points.length <= 1;
		const mapStyle = getActiveStyleName( settings.styles, attributes.className );
		const placeholderAPIStateSuccess = (
			<Fragment>
				{ inspectorControls }
				<div className={ className }>
					<ResizableBox
						size={ {
							height: mapHeight || 'auto',
							width: '100%',
						} }
						grid={ [ 10, 10 ] }
						showHandle={ isSelected }
						minHeight={ MIN_HEIGHT }
						enable={ RESIZABLE_BOX_ENABLE_OPTION }
						onResizeStart={ onResizeStart }
						onResizeStop={ this.onMapResize }
					>
						<div className="wp-block-jetpack-map__map_wrapper">
							<Map
								ref={ this.mapRef }
								scrollToZoom={ allowScrollToZoom }
								showFullscreenButton={ showFullscreenButton }
								mapStyle={ mapStyle || 'default' }
								mapDetails={ mapDetails }
								mapHeight={ mapHeight }
								points={ points }
								zoom={ zoom }
								mapCenter={ mapCenter }
								markerColor={ markerColor }
								onSetZoom={ value => {
									setAttributes( { zoom: value } );
								} }
								admin={ true }
								apiKey={ apiKey }
								onSetPoints={ value => setAttributes( { points: value } ) }
								onSetMapCenter={ value => setAttributes( { mapCenter: value } ) }
								onMapLoaded={ () => this.setState( { addPointVisibility: ! points.length } ) }
								onMarkerClick={ () => this.setState( { addPointVisibility: false } ) }
								onError={ this.onError }
							>
								{ isSelected && addPointVisibility && (
									<AddPoint
										onAddPoint={ this.addPoint }
										onClose={ () => this.setState( { addPointVisibility: false } ) }
										apiKey={ apiKey }
										onError={ this.onError }
										tagName="AddPoint"
									/>
								) }
							</Map>
						</div>
					</ResizableBox>
				</div>
			</Fragment>
		);
		const mapStyleObject = settings.styles.find( styleObject => styleObject.name === mapStyle );
		const placholderPreview = (
			<div>
				<img
					alt={ __( 'Map Preview', 'jetpack' ) }
					src={ mapStyleObject ? mapStyleObject.preview : previewPlaceholder }
				/>
			</div>
		);
		return (
			<Fragment>
				{ noticeUI }
				{ preview && placholderPreview }
				{ ! preview && apiState === API_STATE_LOADING && placholderAPIStateLoading }
				{ ! preview && apiState === API_STATE_FAILURE && placeholderAPIStateFailure }
				{ ! preview && apiState === API_STATE_SUCCESS && placeholderAPIStateSuccess }
			</Fragment>
		);
	}
}

export default compose( [
	withNotices,
	withDispatch( dispatch => {
		const { toggleSelection } = dispatch( 'core/block-editor' );

		return {
			onResizeStart: () => toggleSelection( false ),
			onResizeStop: () => toggleSelection( true ),
		};
	} ),
] )( MapEdit );
