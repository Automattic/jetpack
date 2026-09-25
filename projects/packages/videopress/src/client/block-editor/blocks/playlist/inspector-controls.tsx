/**
 * WordPress dependencies
 */
import {
	__experimentalFontFamilyControl as FontFamilyControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
	InspectorControls,
	useSettings,
} from '@wordpress/block-editor';
import { PanelBody, ToggleControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
/**
 * Types
 */
import type { PlaylistDisplayAttributes, PlaylistLayout } from './types';

type ControlsProps = {
	attributes: PlaylistDisplayAttributes;
	setAttributes: ( attributes: Partial< PlaylistDisplayAttributes > ) => void;
};

type LayoutOption = { value: PlaylistLayout; label: string };

const LAYOUT_OPTIONS: LayoutOption[] = [
	{ value: 'side-rail', label: __( 'Side rail', 'jetpack-videopress-pkg' ) },
	{ value: 'grid', label: __( 'Grid', 'jetpack-videopress-pkg' ) },
	{ value: 'strip', label: __( 'Strip', 'jetpack-videopress-pkg' ) },
];

/**
 * The playback and per-entry display panels shared by the playlist blocks,
 * to be rendered inside the caller's settings InspectorControls.
 *
 * @param props               - Component props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return The panels.
 */
export function PlaylistSettingsPanels( { attributes, setAttributes }: ControlsProps ) {
	const {
		autoplayNext,
		muteByDefault,
		loopPlaylist,
		showThumbnail,
		showTitle,
		showResolution,
		showDuration,
		showPositionNumber,
		showTotalRuntime,
	} = attributes;

	// Kept as separate statements: a shared ternary of __() calls would let
	// the minifier merge them, breaking translation extraction.
	const autoplayHelp = __(
		'Play the next video automatically when one ends.',
		'jetpack-videopress-pkg'
	);
	const autoplayImpliedHelp = __(
		'Looping the playlist keeps autoplay on.',
		'jetpack-videopress-pkg'
	);

	return (
		<>
			<PanelBody title={ __( 'Playback', 'jetpack-videopress-pkg' ) }>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Autoplay next', 'jetpack-videopress-pkg' ) }
					help={ loopPlaylist ? autoplayImpliedHelp : autoplayHelp }
					checked={ autoplayNext || loopPlaylist }
					disabled={ loopPlaylist }
					onChange={ ( value: boolean ) => setAttributes( { autoplayNext: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Mute by default', 'jetpack-videopress-pkg' ) }
					help={ __( 'Start playback muted.', 'jetpack-videopress-pkg' ) }
					checked={ muteByDefault }
					onChange={ ( value: boolean ) => setAttributes( { muteByDefault: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Loop playlist', 'jetpack-videopress-pkg' ) }
					help={ __(
						'Restart from the first video after the last one ends.',
						'jetpack-videopress-pkg'
					) }
					checked={ loopPlaylist }
					onChange={ ( value: boolean ) => setAttributes( { loopPlaylist: value } ) }
				/>
			</PanelBody>

			<PanelBody title={ __( 'Show on each entry', 'jetpack-videopress-pkg' ) }>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Thumbnail', 'jetpack-videopress-pkg' ) }
					checked={ showThumbnail }
					onChange={ ( value: boolean ) => setAttributes( { showThumbnail: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Title', 'jetpack-videopress-pkg' ) }
					checked={ showTitle }
					onChange={ ( value: boolean ) => setAttributes( { showTitle: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Resolution', 'jetpack-videopress-pkg' ) }
					checked={ showResolution }
					onChange={ ( value: boolean ) => setAttributes( { showResolution: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Duration', 'jetpack-videopress-pkg' ) }
					checked={ showDuration }
					onChange={ ( value: boolean ) => setAttributes( { showDuration: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Position number', 'jetpack-videopress-pkg' ) }
					checked={ showPositionNumber }
					onChange={ ( value: boolean ) => setAttributes( { showPositionNumber: value } ) }
				/>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Total runtime in header', 'jetpack-videopress-pkg' ) }
					checked={ showTotalRuntime }
					onChange={ ( value: boolean ) => setAttributes( { showTotalRuntime: value } ) }
				/>
			</PanelBody>
		</>
	);
}

/**
 * The Styles-tab controls shared by the playlist blocks: layout picker,
 * dark player surface and the entry-title typography.
 *
 * @param props               - Component props.
 * @param props.attributes    - Block attributes.
 * @param props.setAttributes - Attribute setter.
 * @return The controls, in the Styles inspector group.
 */
export function PlaylistStylesControls( { attributes, setAttributes }: ControlsProps ) {
	const { layout, darkPlayer, entryTitleFontFamily } = attributes;

	/*
	 * Theme font-family presets, as used by core blocks' typography tools.
	 * Queried per origin — the bare `typography.fontFamilies` path returns
	 * the raw origins object, not a list. Attributes store the preset slug;
	 * the control works in CSS values.
	 */
	type FontFamilyPreset = { name?: string; slug: string; fontFamily: string };
	const [ customFontFamilies, themeFontFamilies, defaultFontFamilies ] = useSettings(
		'typography.fontFamilies.custom',
		'typography.fontFamilies.theme',
		'typography.fontFamilies.default'
	) as Array< FontFamilyPreset[] | undefined >;
	const fontFamilies: FontFamilyPreset[] = [
		...( customFontFamilies ?? [] ),
		...( themeFontFamilies ?? [] ),
		...( defaultFontFamilies ?? [] ),
	];
	const fontFamilyValueOf = ( slug: string ) =>
		fontFamilies.find( preset => preset.slug === slug )?.fontFamily ?? '';
	const fontFamilySlugOf = ( value: string ) =>
		fontFamilies.find( preset => preset.fontFamily === value )?.slug ?? '';

	return (
		<InspectorControls group="styles">
			<PanelBody title={ __( 'Layout', 'jetpack-videopress-pkg' ) }>
				<div
					className="videopress-playlist-editor__layouts"
					role="group"
					aria-label={ __( 'Layout', 'jetpack-videopress-pkg' ) }
				>
					{ LAYOUT_OPTIONS.map( option => (
						<button
							key={ option.value }
							type="button"
							className={
								layout === option.value
									? 'videopress-playlist-editor__layout is-selected'
									: 'videopress-playlist-editor__layout'
							}
							aria-pressed={ layout === option.value }
							onClick={ () => setAttributes( { layout: option.value } ) }
						>
							<span
								className={ `videopress-playlist-editor__layout-sketch is-${ option.value }` }
								aria-hidden="true"
							>
								<i />
								<i />
								<i />
								<i />
							</span>
							{ option.label }
						</button>
					) ) }
				</div>
				<ToggleControl
					__nextHasNoMarginBottom
					label={ __( 'Dark player surface', 'jetpack-videopress-pkg' ) }
					checked={ darkPlayer }
					onChange={ ( value: boolean ) => setAttributes( { darkPlayer: value } ) }
				/>
			</PanelBody>
			{ fontFamilies.length > 0 && (
				<PanelBody title={ __( 'Typography', 'jetpack-videopress-pkg' ) }>
					<div className="videopress-playlist-editor__font-control">
						<FontFamilyControl
							fontFamilies={ fontFamilies }
							label={ __( 'Entry titles', 'jetpack-videopress-pkg' ) }
							value={ fontFamilyValueOf( entryTitleFontFamily ) }
							onChange={ ( value: string ) =>
								setAttributes( { entryTitleFontFamily: fontFamilySlugOf( value ) } )
							}
						/>
					</div>
				</PanelBody>
			) }
		</InspectorControls>
	);
}
