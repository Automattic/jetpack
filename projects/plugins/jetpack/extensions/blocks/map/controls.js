import { BlockAlignmentToolbar, PanelColorSettings } from '@wordpress/block-editor';
import {
	Button,
	ButtonGroup,
	ExternalLink,
	PanelBody,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
	RangeControl,
	BaseControl,
	SVG,
	G,
	Polygon,
	Path,
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import Locations from './locations';

const markerIcon = (
	/* Do not use SVG components from @wordpress/component to avoid frontend bloat */
	<SVG width="14" height="20" viewBox="0 0 14 20" xmlns="http://www.w3.org/2000/svg">
		<G id="Page-1" fill="none" fillRule="evenodd">
			<G id="outline-add_location-24px" transform="translate(-5 -2)">
				<Polygon id="Shape" points="0 0 24 0 24 24 0 24" />
				<Path
					d="M12,2 C8.14,2 5,5.14 5,9 C5,14.25 12,22 12,22 C12,22 19,14.25 19,9 C19,5.14 15.86,2 12,2 Z M7,9 C7,6.24 9.24,4 12,4 C14.76,4 17,6.24 17,9 C17,11.88 14.12,16.19 12,18.88 C9.92,16.21 7,11.85 7,9 Z M13,6 L11,6 L11,8 L9,8 L9,10 L11,10 L11,12 L13,12 L13,10 L15,10 L15,8 L13,8 L13,6 Z"
					id="Shape"
					fill="#000"
					fillRule="nonzero"
				/>
			</G>
		</G>
	</SVG>
);

export default ( {
	attributes,
	setAttributes,
	apiKey,
	apiKeySource,
	apiKeyControl,
	onKeyChange,
	context,
	mapRef,
	instanceId,
	minHeight,
	removeAPIKey,
	updateAPIKey,
	setPointVisibility,
	mapProvider,
} ) => {
	const updateAlignment = value => {
		setAttributes( { align: value } );

		// Allow one cycle for alignment change to take effect
		if ( mapRef.current?.sizeMap ) {
			setTimeout( mapRef.current.sizeMap, 0 );
		}
	};

	/**
	 * Change event handler for the map height sidebar control. Ensures the height is valid,
	 * and updates both the height attribute, and the map component's height in the DOM.
	 *
	 * @param {Event} event - The change event object.
	 */
	const onHeightChange = event => {
		const { mapHeight } = attributes;

		let height = parseInt( event.target.value, 10 );

		if ( isNaN( height ) ) {
			// Set map height to default size and input box to empty string
			height = null;
		} else if ( null == mapHeight ) {
			// There was previously no height defined, so set the default.
			const ref = mapRef?.current?.mapRef ?? mapRef;
			height = ref?.current.offsetHeight;
		} else if ( height < minHeight ) {
			// Set map height to minimum size
			height = minHeight;
		}

		setAttributes( {
			mapHeight: height,
		} );

		if ( mapRef.current.sizeMap ) {
			setTimeout( mapRef.current.sizeMap, 0 );
		}
	};

	if ( context === 'toolbar' ) {
		return (
			<>
				<BlockAlignmentToolbar
					value={ attributes.align }
					onChange={ updateAlignment }
					controls={ [ 'center', 'wide', 'full' ] }
				/>
				<ToolbarGroup>
					<ToolbarButton
						icon={ markerIcon }
						label={ __( 'Add a marker', 'jetpack' ) }
						onClick={ setPointVisibility }
					/>
				</ToolbarGroup>
			</>
		);
	}

	return (
		<>
			<PanelColorSettings
				title={ __( 'Colors', 'jetpack' ) }
				initialOpen={ true }
				colorSettings={ [
					{
						value: attributes.markerColor,
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
								if ( mapRef.current ) {
									setTimeout( mapRef.current.sizeMap, 0 );
								}
							}
						} }
						onBlur={ onHeightChange }
						value={ attributes.mapHeight || '' }
						min={ minHeight }
						step="10"
					/>
				</BaseControl>
				<RangeControl
					label={ __( 'Zoom level', 'jetpack' ) }
					help={
						attributes.points.length > 1 &&
						__(
							'The default zoom level cannot be changed when there are two or more markers on the map.',
							'jetpack'
						)
					}
					disabled={ attributes.points.length > 1 }
					value={ Math.round( attributes.zoom ) }
					onChange={ value => {
						setAttributes( { zoom: value } );
						if ( mapRef.current && mapRef.current.updateZoom ) {
							setTimeout( mapRef.current.updateZoom, 0 );
						}
					} }
					min={ 0 }
					max={ 22 }
				/>
				{ mapProvider === 'mapbox' ? (
					<ToggleControl
						label={ __( 'Show street names', 'jetpack' ) }
						checked={ attributes.mapDetails }
						onChange={ value => setAttributes( { mapDetails: value } ) }
					/>
				) : null }

				<ToggleControl
					label={ __( 'Scroll to zoom', 'jetpack' ) }
					help={ __( 'Allow the map to capture scrolling, and zoom in or out.', 'jetpack' ) }
					checked={ attributes.scrollToZoom }
					onChange={ value => setAttributes( { scrollToZoom: value } ) }
				/>

				{ mapProvider === 'mapbox' ? (
					<ToggleControl
						label={ __( 'Show Fullscreen Button', 'jetpack' ) }
						help={ __( 'Allow your visitors to display the map in fullscreen.', 'jetpack' ) }
						checked={ attributes.showFullscreenButton }
						onChange={ value => setAttributes( { showFullscreenButton: value } ) }
					/>
				) : null }
			</PanelBody>
			{ attributes.points.length ? (
				<PanelBody title={ __( 'Markers', 'jetpack' ) } initialOpen={ false }>
					<Locations
						points={ attributes.points }
						onChange={ value => {
							setAttributes( { points: value } );
						} }
					/>
				</PanelBody>
			) : null }
			{ mapProvider === 'mapbox' ? (
				<PanelBody title={ __( 'Mapbox Access Token', 'jetpack' ) } initialOpen={ false }>
					<TextControl
						help={
							'wpcom' === apiKeySource && (
								<>
									{ __( 'You can optionally enter your own access token.', 'jetpack' ) }{ ' ' }
									<ExternalLink href="https://account.mapbox.com/access-tokens/">
										{ __( 'Find it on Mapbox', 'jetpack' ) }
									</ExternalLink>
								</>
							)
						}
						label={ __( 'Mapbox Access Token', 'jetpack' ) }
						value={ apiKeyControl }
						onChange={ onKeyChange }
					/>
					<ButtonGroup>
						<Button
							type="button"
							onClick={ updateAPIKey }
							disabled={ ! apiKeyControl || apiKeyControl === apiKey }
						>
							{ __( 'Update Token', 'jetpack' ) }
						</Button>
						<Button
							type="button"
							onClick={ removeAPIKey }
							disabled={ 'wpcom' === apiKeySource }
							variant="secondary"
						>
							{ __( 'Remove Token', 'jetpack' ) }
						</Button>
					</ButtonGroup>
				</PanelBody>
			) : null }
		</>
	);
};
