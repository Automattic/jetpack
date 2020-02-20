/**
 * External dependencies
 */
import apiFetch from '@wordpress/api-fetch';
import { __ } from '@wordpress/i18n';
import { Component, createRef, Fragment } from '@wordpress/element';
import {
	Button,
	ButtonGroup,
	ExternalLink,
	IconButton,
	PanelBody,
	Placeholder,
	Spinner,
	TextControl,
	ToggleControl,
	Toolbar,
	withNotices,
	ResizableBox,
	RangeControl,
	BaseControl,
} from '@wordpress/components';
import {
	BlockAlignmentToolbar,
	BlockControls,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import classnames from 'classnames';

/**
 * Internal dependencies
 */
import AddPoint from './add-point';
import Locations from './locations';
import Map from './component.js';
import MapThemePicker from './map-theme-picker';
import { settings } from './settings.js';
import previewPlaceholder from './map-preview.jpg';
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';

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
	updateAlignment = value => {
		this.props.setAttributes( { align: value } );
		// Allow one cycle for alignment change to take effect
		setTimeout( this.mapRef.current.sizeMap, 0 );
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
	 * Change event handler for the map height sidebar control. Ensures the height is valid,
	 * and updates both the height attribute, and the map component's height in the DOM.
	 *
	 * @param {Event} event The change event object.
	 */
	onHeightChange = event => {
		const { attributes, setAttributes } = this.props;
		const { mapHeight } = attributes;

		let height = parseInt( event.target.value, 10 );

		if ( isNaN( height ) ) {
			// Set map height to default size and input box to empty string
			height = null;
		} else if ( null == mapHeight ) {
			// There was previously no height defined, so set the default.
			height = this.mapRef.current.mapRef.current.offsetHeight;
		} else if ( height < MIN_HEIGHT ) {
			// Set map height to minimum size
			height = MIN_HEIGHT;
		}

		setAttributes( {
			mapHeight: height,
		} );

		setTimeout( this.mapRef.current.sizeMap, 0 );
	};

	/**
	 * Event handler for the ResizableBox component. Updates both the height attribute,
	 * and the map component's height in the DOM.
	 *
	 * @param {Event} event The event object.
	 * @param {ResizeDirection} direction A string representing which resize handler was used.
	 * @param {HtmlDivElement} elt A ref to the ResizeableBox's container element.
	 * @param {NumberSize} delta Information about how far the element was resized.
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
			mapStyle,
			mapDetails,
			points,
			zoom,
			mapCenter,
			markerColor,
			align,
			preview,
			scrollToZoom,
			mapHeight,
			showFullscreenButton,
		} = attributes;
		const {
			addPointVisibility,
			apiKey,
			apiKeyControl,
			apiKeySource,
			apiState,
			apiRequestOutstanding,
		} = this.state;
		const inspectorControls = (
			<Fragment>
				<BlockControls>
					<BlockAlignmentToolbar
						value={ align }
						onChange={ this.updateAlignment }
						controls={ [ 'center', 'wide', 'full' ] }
					/>
					<Toolbar>
						<IconButton
							icon={ settings.markerIcon }
							label={ __( 'Add a marker', 'jetpack' ) }
							onClick={ () => this.setState( { addPointVisibility: true } ) }
						/>
					</Toolbar>
				</BlockControls>
				<InspectorControls>
					<PanelBody title={ __( 'Map Theme', 'jetpack' ) }>
						<MapThemePicker
							value={ mapStyle }
							onChange={ value => setAttributes( { mapStyle: value } ) }
							options={ settings.mapStyleOptions }
						/>
						<ToggleControl
							label={ __( 'Show street names', 'jetpack' ) }
							checked={ mapDetails }
							onChange={ value => setAttributes( { mapDetails: value } ) }
						/>
					</PanelBody>
					<PanelColorSettings
						title={ __( 'Colors', 'jetpack' ) }
						initialOpen={ true }
						colorSettings={ [
							{
								value: markerColor,
								onChange: value => setAttributes( { markerColor: value } ),
								label: __( 'Marker Color', 'jetpack' ),
							},
						] }
					/>
					<PanelBody title={ __( 'Map Settings', 'jetpack' ) }>
						<BaseControl
							label={ __( 'Height in pixels', 'jetpack' ) }
							id={ `block-jetpack-map-height-input-${ instanceId }` }
						>
							<input
								type="number"
								id={ `block-jetpack-map-height-input-${ instanceId }` }
								className="wp-block-jetpack-map__height_input"
								onChange={ event => {
									setAttributes( { mapHeight: event.target.value } );
									// If this input isn't focussed, the onBlur handler won't be triggered
									// to commit the map size, so we need to check for that.
									if ( event.target !== document.activeElement ) {
										setTimeout( this.mapRef.current.sizeMap, 0 );
									}
								} }
								onBlur={ this.onHeightChange }
								value={ mapHeight || '' }
								min={ MIN_HEIGHT }
								step="10"
							/>
						</BaseControl>
						<RangeControl
							label={ __( 'Zoom level', 'jetpack' ) }
							help={
								points.length > 1 &&
								__(
									'The default zoom level cannot be changed when there are two or more markers on the map.',
									'jetpack'
								)
							}
							disabled={ points.length > 1 }
							value={ zoom }
							onChange={ value => {
								setAttributes( { zoom: value } );
								setTimeout( this.mapRef.current.updateZoom, 0 );
							} }
							min={ 0 }
							max={ 22 }
						/>
						<ToggleControl
							label={ __( 'Scroll to zoom', 'jetpack' ) }
							help={ __( 'Allow the map to capture scrolling, and zoom in or out.', 'jetpack' ) }
							checked={ scrollToZoom }
							onChange={ value => setAttributes( { scrollToZoom: value } ) }
						/>
						<ToggleControl
							label={ __( 'Show Fullscreen Button', 'jetpack' ) }
							help={ __( 'Allow your visitors to display the map in fullscreen.', 'jetpack' ) }
							checked={ showFullscreenButton }
							onChange={ value => setAttributes( { showFullscreenButton: value } ) }
						/>
					</PanelBody>
					{ points.length ? (
						<PanelBody title={ __( 'Markers', 'jetpack' ) } initialOpen={ false }>
							<Locations
								points={ points }
								onChange={ value => {
									setAttributes( { points: value } );
								} }
							/>
						</PanelBody>
					) : null }
					<PanelBody title={ __( 'Mapbox Access Token', 'jetpack' ) } initialOpen={ false }>
						<TextControl
							help={
								'wpcom' === apiKeySource && (
									<>
										{ __( 'You can optionally enter your own access token.', 'jetpack' ) }{' '}
										<ExternalLink href="https://account.mapbox.com/access-tokens/">
											{ __( 'Find it on Mapbox', 'jetpack' ) }
										</ExternalLink>
									</>
								)
							}
							label={ __( 'Mapbox Access Token', 'jetpack' ) }
							value={ apiKeyControl }
							onChange={ value => this.setState( { apiKeyControl: value } ) }
						/>
						<ButtonGroup>
							<Button
								type="button"
								onClick={ this.updateAPIKey }
								disabled={ ! apiKeyControl || apiKeyControl === apiKey }
								isDefault
							>
								{ __( 'Update Token', 'jetpack' ) }
							</Button>
							<Button
								type="button"
								onClick={ this.removeAPIKey }
								disabled={ 'wpcom' === apiKeySource }
								isDefault
							>
								{ __( 'Remove Token', 'jetpack' ) }
							</Button>
						</ButtonGroup>
					</PanelBody>
				</InspectorControls>
			</Fragment>
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
							isLarge
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
		const placeholderAPIStateSuccess = (
			<Fragment>
				{ inspectorControls }
				<div className={ className }>
					<ResizableBox
						className={
							// @TODO: This can be removed when WP 5.4 is the minimum version, it's a fallback
							// for prior to when the `showHandle` property was added.
							classnames( { 'is-selected': isSelected } )
						}
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
								mapStyle={ mapStyle }
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
		const placholderPreview = (
			<div>
				<img alt={ __( 'Map Preview', 'jetpack' ) } src={ previewPlaceholder } />
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
