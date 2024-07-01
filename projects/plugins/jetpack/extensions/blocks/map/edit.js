import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import apiFetch from '@wordpress/api-fetch';
import { BlockControls, InspectorControls, useBlockProps } from '@wordpress/block-editor';
import {
	Button,
	ExternalLink,
	Placeholder,
	Spinner,
	withNotices,
	ResizableBox,
} from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { withDispatch } from '@wordpress/data';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { getActiveStyleName } from '../../shared/block-styles';
import AddPoint from './add-point';
import metadata from './block.json';
import Map from './component';
import Controls from './controls';
import { getCoordinates } from './get-coordinates.js';
import previewPlaceholder from './map-preview.jpg';
import styles from './styles';
import getMapProvider from './utils/get-map-provider';

const icon = getBlockIconComponent( metadata );

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

const MapEdit = ( {
	setAttributes,
	attributes,
	noticeUI,
	notices,
	isSelected,
	instanceId,
	onResizeStart,
	onResizeStop,
	noticeOperations,
} ) => {
	const {
		address,
		mapDetails,
		points,
		zoom,
		mapCenter,
		markerColor,
		preview,
		mapHeight,
		showFullscreenButton,
	} = attributes;

	const [ addPointVisibility, setAddPointVisibility ] = useState( false );
	const [ apiState, setApiState ] = useState( API_STATE_LOADING );
	const [ apiKey, setApiKey ] = useState( null );
	const [ apiKeyControl, setApiKeyControl ] = useState( null );
	const [ apiKeySource, setApiKeySource ] = useState( null );
	const [ apiRequestOutstanding, setApiRequestOutstanding ] = useState( null );
	const mapRef = useRef( null );
	const blockProps = useBlockProps();
	const { className } = blockProps;

	const mapStyle = getActiveStyleName( styles, className );
	const mapProvider = getMapProvider( { mapStyle } );

	const geoCodeAddress = () => {
		if ( ! address || ! apiKey || mapProvider === 'mapkit' ) {
			return;
		}

		getCoordinates( address, apiKey )
			.then( result => {
				if ( ! result.features?.length ) {
					onError(
						null,
						__(
							'Could not find the coordinates of the provided address. Displaying default location. Feel free to add the location manually.',
							'jetpack'
						)
					);
				} else {
					const feature = result.features[ 0 ];
					const newPoint = [
						{
							title: feature.text,
							placeTitle: feature.text,
							caption: feature.place_name,
							id: feature.id,
							coordinates: {
								latitude: feature.center[ 1 ],
								longitude: feature.center[ 0 ],
							},
						},
					];
					setAttributes( { points: newPoint } );
				}
			} )
			.catch( error => onError( null, error.message ) );
	};

	const apiCall = ( serviceApiKey = null, method = 'GET' ) => {
		return new Promise( ( resolve, reject ) => {
			const path = '/wpcom/v2/service-api-keys/mapbox';
			const fetch = serviceApiKey
				? { path, method, data: { service_api_key: serviceApiKey } }
				: { path, method };

			setApiRequestOutstanding( true );

			apiFetch( fetch ).then(
				( { service_api_key: key, service_api_key_source: source } ) => {
					noticeOperations.removeAllNotices();

					setApiState( key ? API_STATE_SUCCESS : API_STATE_FAILURE );
					setApiKey( key );
					setApiKeyControl( 'wpcom' === source ? '' : key );
					setApiKeySource( source );
					setApiRequestOutstanding( false );

					resolve();
				},
				( { message } ) => {
					onError( null, message );

					setApiState( API_STATE_FAILURE );
					setApiRequestOutstanding( false );

					reject();
				}
			);
		} );
	};

	const addPoint = point => {
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
		setAddPointVisibility( false );
	};

	const updateAPIKey = () => {
		noticeOperations.removeAllNotices();

		if ( apiKeyControl ) {
			apiCall( apiKeyControl, 'POST' );
		}
	};

	const removeAPIKey = () => apiCall( null, 'DELETE' );

	const onError = ( code, message ) => {
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
	const onMapResize = ( event, direction, elt, delta ) => {
		onResizeStop();

		const ref = mapRef?.current?.mapRef ?? mapRef;

		if ( ref ) {
			const height = parseInt( ref.current.offsetHeight + delta.height, 10 );

			setAttributes( {
				mapHeight: height,
			} );

			if ( ref.current.sizeMap ) {
				setTimeout( ref.current.sizeMap, 0 );
			}
		}
	};

	useEffect( () => {
		if ( mapProvider === 'mapbox' ) {
			apiCall().then( geoCodeAddress );
		} else {
			setApiState( API_STATE_SUCCESS );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	// eslint-disable-next-line react-hooks/exhaustive-deps
	useEffect( geoCodeAddress, [ address ] );

	useEffect( () => {
		// Fetch API key when switching from mapkit to mapbox
		if ( className && ! apiKey ) {
			setApiState( API_STATE_LOADING );
			apiCall();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ className ] );

	let content;

	if ( preview ) {
		const mapStyleObject = styles.find( styleObject => styleObject.name === mapStyle );

		content = (
			<div>
				<img
					alt={ __( 'Map Preview', 'jetpack' ) }
					src={ mapStyleObject ? mapStyleObject.preview : previewPlaceholder }
				/>
			</div>
		);
	} else if ( apiState === API_STATE_LOADING ) {
		content = (
			<Placeholder icon={ icon }>
				<Spinner />
			</Placeholder>
		);
	} else if ( apiState === API_STATE_FAILURE ) {
		content = (
			<Placeholder icon={ icon } label={ __( 'Map', 'jetpack' ) } notices={ notices }>
				<>
					<p className="components-placeholder__instructions">
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
					</p>

					<form>
						<input
							type="text"
							className="components-placeholder__input"
							disabled={ apiRequestOutstanding }
							placeholder={ __( 'Paste Token Here', 'jetpack' ) }
							value={ apiKeyControl }
							onChange={ event => setApiKeyControl( event.target.value ) }
						/>
						<Button
							variant="secondary"
							disabled={ apiRequestOutstanding || ! apiKeyControl || apiKeyControl.length < 1 }
							onClick={ updateAPIKey }
						>
							{ __( 'Set Token', 'jetpack' ) }
						</Button>
					</form>
				</>
			</Placeholder>
		);
	} else if ( apiState === API_STATE_SUCCESS ) {
		const onKeyChange = value => setApiKeyControl( value );

		// Only scroll to zoom when the block is selected, and there's 1 or less points.
		const allowScrollToZoom = isSelected && points.length <= 1;

		content = (
			<>
				<BlockControls>
					<Controls
						attributes={ attributes }
						setAttributes={ setAttributes }
						apiKey={ apiKey }
						apiKeySource={ apiKeySource }
						apiKeyControl={ apiKeyControl }
						onKeyChange={ onKeyChange }
						setPointVisibility={ () => setAddPointVisibility( true ) }
						context="toolbar"
						mapRef={ mapRef }
						mapProvider={ mapProvider }
					/>
				</BlockControls>

				<InspectorControls>
					<Controls
						attributes={ attributes }
						setAttributes={ setAttributes }
						apiKey={ apiKey }
						apiKeySource={ apiKeySource }
						apiKeyControl={ apiKeyControl }
						onKeyChange={ onKeyChange }
						mapRef={ mapRef }
						instanceId={ instanceId }
						minHeight={ MIN_HEIGHT }
						removeAPIKey={ removeAPIKey }
						updateAPIKey={ updateAPIKey }
						mapProvider={ mapProvider }
					/>
				</InspectorControls>

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
					onResizeStop={ onMapResize }
				>
					<div className="wp-block-jetpack-map__map_wrapper">
						<Map
							ref={ mapRef }
							address={ address }
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
							onMapLoaded={ () => setAddPointVisibility( ! points.length ) }
							onMarkerClick={ () => setAddPointVisibility( false ) }
							onError={ onError }
							mapProvider={ mapProvider }
						>
							{ isSelected && addPointVisibility && (
								<AddPoint
									onAddPoint={ addPoint }
									onClose={ () => setAddPointVisibility( false ) }
									apiKey={ apiKey }
									onError={ onError }
									tagName="AddPoint"
									mapProvider={ mapProvider }
								/>
							) }
						</Map>
					</div>
				</ResizableBox>
			</>
		);
	}

	return (
		<div { ...blockProps }>
			{ noticeUI }
			{ content }
		</div>
	);
};

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
