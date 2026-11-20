import { SelectControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Card, RadioGroupControl, Stack, SwitchControl } from '@wordpress/ui';
import { useFontFamilyPresets } from '../../hooks/use-font-family-presets';
import type {
	PlaylistEntryClickAction,
	PlaylistLayout,
} from '../../../client/block-editor/blocks/playlist/types';
import type { PlaylistSettings } from '../../types/playlists';

type Props = {
	settings: PlaylistSettings;
	disabled?: boolean;
	onChange: ( patch: Partial< PlaylistSettings > ) => void;
};

const LAYOUT_OPTIONS: Array< { value: PlaylistLayout; label: string } > = [
	{ value: 'side-rail', label: __( 'Side rail', 'jetpack-videopress-pkg' ) },
	{ value: 'grid', label: __( 'Grid', 'jetpack-videopress-pkg' ) },
	{ value: 'strip', label: __( 'Strip', 'jetpack-videopress-pkg' ) },
];

/**
 * The Video Playlist block's Playback panel, as a dashboard card.
 *
 * @param props          - Component props.
 * @param props.settings - Current settings.
 * @param props.disabled - Read-only.
 * @param props.onChange - Receives changed settings.
 * @return The card.
 */
export function PlaybackCard( { settings, disabled, onChange }: Props ) {
	const { showPlayer, entryClickAction, autoplayNext, muteByDefault, loopPlaylist } = settings;

	// Separate statements so minification can't merge the two strings' calls.
	const autoplayHelp = __(
		'Play the next video automatically when one ends.',
		'jetpack-videopress-pkg'
	);
	const autoplayImpliedHelp = __(
		'Looping the playlist keeps autoplay on.',
		'jetpack-videopress-pkg'
	);

	// With the player hidden for good, the playback options have nothing to act on.
	const playbackDisabled = ! showPlayer && entryClickAction !== 'show-player';

	return (
		<Card.Root className="vp-playlist-editor__settings-card">
			<Card.Header>
				<Card.Title>{ __( 'Playback', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<SwitchControl
						label={ __( 'Show player', 'jetpack-videopress-pkg' ) }
						description={ __(
							'Turn off to show only the list of videos.',
							'jetpack-videopress-pkg'
						) }
						checked={ showPlayer }
						disabled={ disabled }
						onCheckedChange={ ( value: boolean ) => onChange( { showPlayer: value } ) }
					/>
					{ ! showPlayer && (
						<RadioGroupControl
							label={ __( 'When a video is clicked', 'jetpack-videopress-pkg' ) }
							value={ entryClickAction }
							disabled={ disabled }
							items={ [
								{
									label: __( 'Open it on VideoPress in a new tab', 'jetpack-videopress-pkg' ),
									value: 'new-tab',
								},
								{
									label: __( 'Show the player and play it', 'jetpack-videopress-pkg' ),
									value: 'show-player',
								},
							] }
							onValueChange={ ( value: string ) =>
								onChange( { entryClickAction: value as PlaylistEntryClickAction } )
							}
						/>
					) }
					<SwitchControl
						label={ __( 'Autoplay next', 'jetpack-videopress-pkg' ) }
						description={ loopPlaylist ? autoplayImpliedHelp : autoplayHelp }
						checked={ autoplayNext || loopPlaylist }
						disabled={ disabled || loopPlaylist || playbackDisabled }
						onCheckedChange={ ( value: boolean ) => onChange( { autoplayNext: value } ) }
					/>
					<SwitchControl
						label={ __( 'Mute by default', 'jetpack-videopress-pkg' ) }
						description={ __( 'Start playback muted.', 'jetpack-videopress-pkg' ) }
						checked={ muteByDefault }
						disabled={ disabled || playbackDisabled }
						onCheckedChange={ ( value: boolean ) => onChange( { muteByDefault: value } ) }
					/>
					<SwitchControl
						label={ __( 'Loop playlist', 'jetpack-videopress-pkg' ) }
						description={ __(
							'Restart from the first video after the last one ends.',
							'jetpack-videopress-pkg'
						) }
						checked={ loopPlaylist }
						disabled={ disabled || playbackDisabled }
						onCheckedChange={ ( value: boolean ) => onChange( { loopPlaylist: value } ) }
					/>
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * The Video Playlist block's "Show on each entry" panel, as a dashboard card.
 *
 * @param props          - Component props.
 * @param props.settings - Current settings.
 * @param props.disabled - Read-only.
 * @param props.onChange - Receives changed settings.
 * @return The card.
 */
export function EntryDisplayCard( { settings, disabled, onChange }: Props ) {
	const toggles: Array< { key: keyof PlaylistSettings; label: string } > = [
		{ key: 'showThumbnail', label: __( 'Thumbnail', 'jetpack-videopress-pkg' ) },
		{ key: 'showTitle', label: __( 'Title', 'jetpack-videopress-pkg' ) },
		{ key: 'showResolution', label: __( 'Resolution', 'jetpack-videopress-pkg' ) },
		{ key: 'showDuration', label: __( 'Duration', 'jetpack-videopress-pkg' ) },
		{ key: 'showPositionNumber', label: __( 'Position number', 'jetpack-videopress-pkg' ) },
		{ key: 'showTotalRuntime', label: __( 'Total runtime in header', 'jetpack-videopress-pkg' ) },
	];

	return (
		<Card.Root className="vp-playlist-editor__settings-card">
			<Card.Header>
				<Card.Title>{ __( 'Show on each entry', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					{ toggles.map( ( { key, label } ) => (
						<SwitchControl
							key={ key }
							label={ label }
							checked={ Boolean( settings[ key ] ) }
							disabled={ disabled }
							onCheckedChange={ ( value: boolean ) => onChange( { [ key ]: value } ) }
						/>
					) ) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}

/**
 * The Video Playlist block's Styles controls ( layout, dark surface, entry
 * title font ), as a dashboard card.
 *
 * @param props          - Component props.
 * @param props.settings - Current settings.
 * @param props.disabled - Read-only.
 * @param props.onChange - Receives changed settings.
 * @return The card.
 */
export function AppearanceCard( { settings, disabled, onChange }: Props ) {
	const { layout, darkPlayer, entryTitleFontFamily } = settings;
	const fontFamilies = useFontFamilyPresets();
	// Keep a slug the theme no longer offers selectable, so saving doesn't silently drop it.
	const fontOptions = [
		{ value: '', label: __( 'Default', 'jetpack-videopress-pkg' ) },
		...fontFamilies.map( preset => ( { value: preset.slug, label: preset.name || preset.slug } ) ),
		...( entryTitleFontFamily &&
		! fontFamilies.some( preset => preset.slug === entryTitleFontFamily )
			? [ { value: entryTitleFontFamily, label: entryTitleFontFamily } ]
			: [] ),
	];

	return (
		<Card.Root className="vp-playlist-editor__settings-card">
			<Card.Header>
				<Card.Title>{ __( 'Layout', 'jetpack-videopress-pkg' ) }</Card.Title>
			</Card.Header>
			<Card.Content>
				<Stack direction="column" gap="md">
					<div
						className="vp-playlist-editor__layouts"
						role="group"
						aria-label={ __( 'Layout', 'jetpack-videopress-pkg' ) }
					>
						{ LAYOUT_OPTIONS.map( option => (
							<button
								key={ option.value }
								type="button"
								disabled={ disabled }
								className={
									layout === option.value
										? 'vp-playlist-editor__layout-option is-selected'
										: 'vp-playlist-editor__layout-option'
								}
								aria-pressed={ layout === option.value }
								onClick={ () => onChange( { layout: option.value } ) }
							>
								<span
									className={ `vp-playlist-editor__layout-sketch is-${ option.value }` }
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
					<SwitchControl
						label={ __( 'Dark player surface', 'jetpack-videopress-pkg' ) }
						checked={ darkPlayer }
						disabled={ disabled }
						onCheckedChange={ ( value: boolean ) => onChange( { darkPlayer: value } ) }
					/>
					{ fontOptions.length > 1 && (
						<SelectControl
							__nextHasNoMarginBottom
							__next40pxDefaultSize
							label={ __( 'Entry titles font', 'jetpack-videopress-pkg' ) }
							value={ entryTitleFontFamily }
							options={ fontOptions }
							disabled={ disabled }
							onChange={ ( value: string ) => onChange( { entryTitleFontFamily: value } ) }
						/>
					) }
				</Stack>
			</Card.Content>
		</Card.Root>
	);
}
