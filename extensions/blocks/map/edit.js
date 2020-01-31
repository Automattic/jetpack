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
} from '@wordpress/components';
import {
	BlockAlignmentToolbar,
	BlockControls,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';

/**
 * Internal dependencies
 */
import AddPoint from './add-point';
import Locations from './locations';
import Map from './component.js';
import MapThemePicker from './map-theme-picker';
import { settings } from './settings.js';
import previewPlaceholder from './map-preview.jpg';

const API_STATE_LOADING = 0;
const API_STATE_FAILURE = 1;
const API_STATE_SUCCESS = 2;

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
	render() {
		const { className, setAttributes, attributes, noticeUI, notices, isSelected } = this.props;
		const {
			mapStyle,
			mapDetails,
			points,
			zoom,
			mapCenter,
			markerColor,
			align,
			preview,
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
							label="Add a marker"
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
								label: 'Marker Color',
							},
						] }
					/>
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
					{ 'wpcom' !== apiKeySource && (
						<PanelBody title={ __( 'Mapbox Access Token', 'jetpack' ) } initialOpen={ false }>
							<TextControl
								label={ __( 'Mapbox Access Token', 'jetpack' ) }
								value={ apiKeyControl }
								onChange={ value => this.setState( { apiKeyControl: value } ) }
							/>
							<ButtonGroup>
								<Button type="button" onClick={ this.updateAPIKey } isDefault>
									{ __( 'Update Token', 'jetpack' ) }
								</Button>
								<Button type="button" onClick={ this.removeAPIKey } isDefault>
									{ __( 'Remove Token', 'jetpack' ) }
								</Button>
							</ButtonGroup>
						</PanelBody>
					) }
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
		const placeholderAPIStateSuccess = (
			<Fragment>
				{ inspectorControls }
				<div className={ className }>
					<Map
						ref={ this.mapRef }
						mapStyle={ mapStyle }
						mapDetails={ mapDetails }
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
						onMapLoaded={ () => this.setState( { addPointVisibility: true } ) }
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

export default withNotices( MapEdit );
