import {
	PanelBody,
	PanelRow,
	SelectControl,
	TextControl,
	TextareaControl,
	ToggleControl,
	__experimentalNumberControl as NumberControl, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { useEntityProp } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { PluginSidebar, store as editorStore } from '@wordpress/editor';
import { useCallback, useMemo } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import {
	EPISODE_TYPE_OPTIONS,
	EXPLICIT_OPTIONS,
	META_PODCAST_AUDIO_MIME,
	META_PODCAST_AUDIO_SIZE,
	META_PODCAST_AUDIO_URL,
	META_PODCAST_BLOCK,
	META_PODCAST_DURATION,
	META_PODCAST_EPISODE_NUMBER,
	META_PODCAST_EPISODE_SUMMARY,
	META_PODCAST_EPISODE_TITLE,
	META_PODCAST_EPISODE_TYPE,
	META_PODCAST_EXPLICIT,
	META_PODCAST_SEASON_NUMBER,
} from './constants';
import { MicrophoneIcon } from './icons';

const SIDEBAR_NAME = 'jetpack-podcast-settings-sidebar';

const useMetaSetter = ( meta, setMeta, key ) =>
	useCallback( value => setMeta( { ...meta, [ key ]: value } ), [ meta, setMeta, key ] );

const useIntMetaSetter = ( meta, setMeta, key ) =>
	useCallback(
		value => setMeta( { ...meta, [ key ]: value ? parseInt( value, 10 ) : 0 } ),
		[ meta, setMeta, key ]
	);

const useBoolMetaSetter = ( meta, setMeta, key ) =>
	useCallback( value => setMeta( { ...meta, [ key ]: !! value } ), [ meta, setMeta, key ] );

const PodcastSettingsSidebar = () => {
	const postType = useSelect( select => select( editorStore ).getCurrentPostType(), [] );
	const [ rawMeta, setMeta ] = useEntityProp( 'postType', postType, 'meta' );
	const meta = useMemo( () => rawMeta || {}, [ rawMeta ] );

	const setAudioUrl = useMetaSetter( meta, setMeta, META_PODCAST_AUDIO_URL );
	const setAudioMime = useMetaSetter( meta, setMeta, META_PODCAST_AUDIO_MIME );
	const setAudioSize = useIntMetaSetter( meta, setMeta, META_PODCAST_AUDIO_SIZE );
	const setDuration = useMetaSetter( meta, setMeta, META_PODCAST_DURATION );
	const setEpisodeTitle = useMetaSetter( meta, setMeta, META_PODCAST_EPISODE_TITLE );
	const setEpisodeSummary = useMetaSetter( meta, setMeta, META_PODCAST_EPISODE_SUMMARY );
	const setSeasonNumber = useIntMetaSetter( meta, setMeta, META_PODCAST_SEASON_NUMBER );
	const setEpisodeNumber = useIntMetaSetter( meta, setMeta, META_PODCAST_EPISODE_NUMBER );
	const setEpisodeType = useMetaSetter( meta, setMeta, META_PODCAST_EPISODE_TYPE );
	const setExplicit = useMetaSetter( meta, setMeta, META_PODCAST_EXPLICIT );
	const setBlock = useBoolMetaSetter( meta, setMeta, META_PODCAST_BLOCK );

	return (
		<PluginSidebar
			name={ SIDEBAR_NAME }
			title={ __( 'Jetpack Podcast', 'jetpack' ) }
			icon={ <MicrophoneIcon /> }
			className="jetpack-podcast-settings-sidebar"
		>
			<PanelBody title={ __( 'Audio', 'jetpack' ) } initialOpen={ true }>
				<PanelRow>
					<TextControl
						label={ __( 'Audio file URL', 'jetpack' ) }
						help={ __( 'Direct link to the episode audio file (MP3, M4A, etc.).', 'jetpack' ) }
						type="url"
						value={ meta[ META_PODCAST_AUDIO_URL ] || '' }
						onChange={ setAudioUrl }
						__nextHasNoMarginBottom
					/>
				</PanelRow>
				<PanelRow>
					<TextControl
						label={ __( 'MIME type', 'jetpack' ) }
						placeholder="audio/mpeg"
						value={ meta[ META_PODCAST_AUDIO_MIME ] || '' }
						onChange={ setAudioMime }
						__nextHasNoMarginBottom
					/>
				</PanelRow>
				<PanelRow>
					<NumberControl
						label={ __( 'File size (bytes)', 'jetpack' ) }
						min={ 0 }
						value={ meta[ META_PODCAST_AUDIO_SIZE ] || '' }
						onChange={ setAudioSize }
						__next40pxDefaultSize
					/>
				</PanelRow>
				<PanelRow>
					<TextControl
						label={ __( 'Duration', 'jetpack' ) }
						help={ __( 'HH:MM:SS or total seconds.', 'jetpack' ) }
						value={ meta[ META_PODCAST_DURATION ] || '' }
						onChange={ setDuration }
						__nextHasNoMarginBottom
					/>
				</PanelRow>
			</PanelBody>

			<PanelBody title={ __( 'Episode details', 'jetpack' ) } initialOpen={ false }>
				<PanelRow>
					<TextControl
						label={ __( 'Episode title override', 'jetpack' ) }
						help={ __( 'Optional. Defaults to the post title.', 'jetpack' ) }
						value={ meta[ META_PODCAST_EPISODE_TITLE ] || '' }
						onChange={ setEpisodeTitle }
						__nextHasNoMarginBottom
					/>
				</PanelRow>
				<PanelRow>
					<TextareaControl
						label={ __( 'Episode summary', 'jetpack' ) }
						help={ __( 'Shown in podcast apps as the episode description.', 'jetpack' ) }
						value={ meta[ META_PODCAST_EPISODE_SUMMARY ] || '' }
						onChange={ setEpisodeSummary }
					/>
				</PanelRow>
				<PanelRow>
					<NumberControl
						label={ __( 'Season number', 'jetpack' ) }
						min={ 0 }
						value={ meta[ META_PODCAST_SEASON_NUMBER ] || '' }
						onChange={ setSeasonNumber }
						__next40pxDefaultSize
					/>
				</PanelRow>
				<PanelRow>
					<NumberControl
						label={ __( 'Episode number', 'jetpack' ) }
						min={ 0 }
						value={ meta[ META_PODCAST_EPISODE_NUMBER ] || '' }
						onChange={ setEpisodeNumber }
						__next40pxDefaultSize
					/>
				</PanelRow>
				<PanelRow>
					<SelectControl
						label={ __( 'Episode type', 'jetpack' ) }
						options={ EPISODE_TYPE_OPTIONS }
						value={ meta[ META_PODCAST_EPISODE_TYPE ] || 'full' }
						onChange={ setEpisodeType }
						__nextHasNoMarginBottom
					/>
				</PanelRow>
				<PanelRow>
					<SelectControl
						label={ __( 'Content rating', 'jetpack' ) }
						options={ EXPLICIT_OPTIONS }
						value={ meta[ META_PODCAST_EXPLICIT ] || '' }
						onChange={ setExplicit }
						__nextHasNoMarginBottom
					/>
				</PanelRow>
			</PanelBody>

			<PanelBody title={ __( 'Distribution', 'jetpack' ) } initialOpen={ false }>
				<PanelRow>
					<ToggleControl
						label={ __( 'Hide from podcast feed', 'jetpack' ) }
						help={ __(
							'When enabled, this episode is excluded from the podcast feed (itunes:block).',
							'jetpack'
						) }
						checked={ !! meta[ META_PODCAST_BLOCK ] }
						onChange={ setBlock }
						__nextHasNoMarginBottom
					/>
				</PanelRow>
			</PanelBody>
		</PluginSidebar>
	);
};

export default PodcastSettingsSidebar;
