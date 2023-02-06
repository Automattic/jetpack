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
} from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import Locations from './locations';
import { settings } from './settings.js';

export default ( {
	attributes,
	setAttributes,
	state,
	setState,
	context,
	mapRef,
	instanceId,
	minHeight,
	removeAPIKey,
	updateAPIKey,
	setPointVisibility,
} ) => {
	const updateAlignment = value => {
		setAttributes( { align: value } );

		// Allow one cycle for alignment change to take effect
		setTimeout( mapRef.current.sizeMap, 0 );
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
			height = mapRef.current.mapRef.current.offsetHeight;
		} else if ( height < minHeight ) {
			// Set map height to minimum size
			height = minHeight;
		}

		setAttributes( {
			mapHeight: height,
		} );

		setTimeout( mapRef.current.sizeMap, 0 );
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
						icon={ settings.markerIcon }
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
								setTimeout( mapRef.current.sizeMap, 0 );
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
					value={ attributes.zoom }
					onChange={ value => {
						setAttributes( { zoom: value } );
						setTimeout( mapRef.current.updateZoom, 0 );
					} }
					min={ 0 }
					max={ 22 }
				/>
				<ToggleControl
					label={ __( 'Show street names', 'jetpack' ) }
					checked={ attributes.mapDetails }
					onChange={ value => setAttributes( { mapDetails: value } ) }
				/>
				<ToggleControl
					label={ __( 'Scroll to zoom', 'jetpack' ) }
					help={ __( 'Allow the map to capture scrolling, and zoom in or out.', 'jetpack' ) }
					checked={ attributes.scrollToZoom }
					onChange={ value => setAttributes( { scrollToZoom: value } ) }
				/>
				<ToggleControl
					label={ __( 'Show Fullscreen Button', 'jetpack' ) }
					help={ __( 'Allow your visitors to display the map in fullscreen.', 'jetpack' ) }
					checked={ attributes.showFullscreenButton }
					onChange={ value => setAttributes( { showFullscreenButton: value } ) }
				/>
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
			<PanelBody title={ __( 'Mapbox Access Token', 'jetpack' ) } initialOpen={ false }>
				<TextControl
					help={
						'wpcom' === state.apiKeySource && (
							<>
								{ __( 'You can optionally enter your own access token.', 'jetpack' ) }{ ' ' }
								<ExternalLink href="https://account.mapbox.com/access-tokens/">
									{ __( 'Find it on Mapbox', 'jetpack' ) }
								</ExternalLink>
							</>
						)
					}
					label={ __( 'Mapbox Access Token', 'jetpack' ) }
					value={ state.apiKeyControl }
					onChange={ value => setState( { apiKeyControl: value } ) }
				/>
				<ButtonGroup>
					<Button
						type="button"
						onClick={ updateAPIKey }
						disabled={ ! state.apiKeyControl || state.apiKeyControl === state.apiKey }
					>
						{ __( 'Update Token', 'jetpack' ) }
					</Button>
					<Button
						type="button"
						onClick={ removeAPIKey }
						disabled={ 'wpcom' === state.apiKeySource }
						variant="secondary"
					>
						{ __( 'Remove Token', 'jetpack' ) }
					</Button>
				</ButtonGroup>
			</PanelBody>
		</>
	);
};
