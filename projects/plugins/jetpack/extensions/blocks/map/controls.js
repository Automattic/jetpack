import { BlockAlignmentToolbar, PanelColorSettings } from '@wordpress/block-editor';
import {
	ExternalLink,
	PanelBody,
	TextControl,
	ToggleControl,
	ToolbarButton,
	ToolbarGroup,
	RangeControl,
	SVG,
	G,
	Polygon,
	Path,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalNumberControl as NumberControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
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
						label: __( 'Marker', 'jetpack' ),
					},
				] }
			/>
			<PanelBody title={ __( 'Settings', 'jetpack' ) }>
				<NumberControl
					label={ __( 'Height in pixels', 'jetpack' ) }
					value={ attributes.mapHeight || '' }
					min={ minHeight }
					onChange={ newValue => {
						setAttributes( { mapHeight: newValue } );
					} }
					size="__unstable-large"
					step={ 10 }
				/>
				<RangeControl
					__nextHasNoMarginBottom={ true }
					__next40pxDefaultSize
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
						__nextHasNoMarginBottom={ true }
						label={ __( 'Show labels', 'jetpack' ) }
						checked={ attributes.mapDetails }
						onChange={ value => setAttributes( { mapDetails: value } ) }
					/>
				) : null }

				<ToggleControl
					__nextHasNoMarginBottom={ true }
					label={ __( 'Scroll to zoom', 'jetpack' ) }
					help={ __( 'Allow the map to capture scrolling, and zoom in or out.', 'jetpack' ) }
					checked={ attributes.scrollToZoom }
					onChange={ value => setAttributes( { scrollToZoom: value } ) }
				/>

				{ mapProvider === 'mapbox' ? (
					<ToggleControl
						__nextHasNoMarginBottom={ true }
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
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize
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
					<div className="jetpack-map-token-settings">
						<ToggleGroupControl isBlock __next40pxDefaultSize __nextHasNoMarginBottom>
							<ToggleGroupControlOption
								className="components-button jetpack-update-token-button"
								label={ __( 'Update Token', 'jetpack' ) }
								value="update"
								onClick={ updateAPIKey }
								disabled={ ! apiKeyControl || apiKeyControl === apiKey }
							/>
							<ToggleGroupControlOption
								className="components-button is-secondary"
								label={ __( 'Remove Token', 'jetpack' ) }
								value="remove"
								onClick={ removeAPIKey }
								disabled={ 'wpcom' === apiKeySource }
							/>
						</ToggleGroupControl>
					</div>
				</PanelBody>
			) : null }
		</>
	);
};
