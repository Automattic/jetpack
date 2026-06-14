/**
 * Block-editor UI for Post to Audio.
 *
 * Lifecycle: loading → idle → running (polled) → done (auto-transforms to
 * core/audio), or → failed.
 *
 * The wpcom backend owns generation; this block only enqueues a job and polls
 * for it through the local Jetpack relay (see class-post-to-audio-endpoint.php).
 * It carries NO jobId attribute — an in-flight job is resumed from the GET
 * feature-info `activeJob` record so a reload (or a second editor tab) recovers
 * the running job by post id.
 *
 * Server-localized config arrives on `window.jetpackPostToAudioBlock` (see
 * Post_To_Audio_Block::load_editor_scripts in PHP): REST paths, defaults, and
 * the poll cadence. Presets and quota are fetched live from the GET endpoint so
 * the wpcom side stays the single source of truth.
 */
import { useBlockProps, InspectorControls } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import {
	PanelBody,
	SelectControl,
	TextareaControl,
	RangeControl,
	Button,
	Spinner,
	Notice,
	Placeholder,
	Icon,
	ExternalLink,
} from '@wordpress/components';
import { useSelect, useDispatch } from '@wordpress/data';
import { useState, useEffect, useRef, useCallback, Fragment } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import apiCall from './api-call';

interface Voice {
	name: string;
	gender?: string;
}

interface Preset {
	key: string;
	label: string;
}

interface Presets {
	voices: Voice[];
	styles: Preset[];
	paces: Preset[];
	music: Preset[];
}

interface Quota {
	quota: number;
	used: number;
	remaining: number;
	resetsAt?: string | null;
}

interface ActiveJob {
	jobId?: number;
	status?: string;
	postId?: number;
	progress?: { done: number; total: number };
	attachmentId?: number;
	audioUrl?: string;
}

interface FeatureInfo {
	quota: Quota;
	activeJob: ActiveJob | Record< string, never >;
	upgradeUrl: string;
	presets: Presets;
	pricing: { modelLabel: string };
}

interface JobStatus {
	jobId: number;
	status: 'pending' | 'complete' | 'failed' | 'unknown';
	attachmentId?: number;
	audioUrl?: string;
	durationSeconds?: number;
	postId?: number;
	editUrl?: string;
}

interface PreviewMeta {
	words: number;
	chunks: number;
	chunkList: string[];
}

interface BlockConfig {
	endpoints: {
		featureInfo: string;
		enqueue: string;
		jobStatus: string;
		previewText: string;
	};
	defaults: {
		voice: string;
		musicGain: number;
		musicGainMin: number;
		musicGainMax: number;
	};
	poll: { intervalMs: number; timeoutMs: number };
}

interface Attributes {
	voice: string;
	style: string;
	pace: string;
	music: string;
	musicGain?: number;
	editedText: string;
	attachmentId?: number;
	audioUrl: string;
	voiceUsed: string;
}

interface EditProps {
	attributes: Attributes;
	setAttributes: ( attrs: Partial< Attributes > ) => void;
	clientId: string;
}

const CONFIG: BlockConfig = ( window as unknown as { jetpackPostToAudioBlock?: BlockConfig } )
	.jetpackPostToAudioBlock || {
	endpoints: {
		featureInfo: '/wpcom/v2/post-to-audio',
		enqueue: '/wpcom/v2/post-to-audio',
		jobStatus: '/wpcom/v2/post-to-audio/jobs/',
		previewText: '/wpcom/v2/post-to-audio/preview-text',
	},
	defaults: { voice: 'Charon', musicGain: 0.1, musicGainMin: 0.0, musicGainMax: 0.3 },
	poll: { intervalMs: 3000, timeoutMs: 5 * 60 * 1000 },
};

function lookupLabel( presets: Preset[], key: string ): string {
	if ( ! key ) {
		return '';
	}
	const found = presets.find( p => p.key === key );
	return found ? found.label : key;
}

type Phase = 'loading' | 'idle' | 'running' | 'done' | 'failed';

export default function Edit( { attributes, setAttributes, clientId }: EditProps ) {
	const initialPhase: Phase = attributes.audioUrl && attributes.attachmentId ? 'done' : 'loading';

	const [ phase, setPhase ] = useState< Phase >( initialPhase );
	const [ info, setInfo ] = useState< FeatureInfo | null >( null );
	const [ progress, setProgress ] = useState< { done: number; total: number } | null >( null );
	const [ error, setError ] = useState( '' );
	const [ previewMeta, setPreviewMeta ] = useState< PreviewMeta | null >( null );
	const [ loadingPreview, setLoadingPreview ] = useState( false );

	const tickRef = useRef< ReturnType< typeof setInterval > | null >( null );
	const startedAtRef = useRef< number >( 0 );

	const postId = useSelect(
		select => ( select( 'core/editor' ) as { getCurrentPostId: () => number } ).getCurrentPostId(),
		[]
	);
	const { replaceBlock } = useDispatch( 'core/block-editor' );

	const stopTicking = useCallback( () => {
		if ( tickRef.current ) {
			clearInterval( tickRef.current );
			tickRef.current = null;
		}
	}, [] );

	const replaceWithAudioBlock = useCallback(
		( attachmentId?: number, audioUrl?: string ): boolean => {
			if ( ! attachmentId || ! audioUrl || ! clientId ) {
				return false;
			}
			try {
				replaceBlock( clientId, createBlock( 'core/audio', { id: attachmentId, src: audioUrl } ) );
				return true;
			} catch ( e ) {
				// eslint-disable-next-line no-console
				console.warn( 'Post to Audio: could not transform to core/audio:', e );
				return false;
			}
		},
		[ clientId, replaceBlock ]
	);

	const finishWithJob = useCallback(
		( job: JobStatus ) => {
			stopTicking();
			setAttributes( { attachmentId: job.attachmentId, audioUrl: job.audioUrl } );
			setPhase( 'done' );
			replaceWithAudioBlock( job.attachmentId, job.audioUrl );
		},
		[ replaceWithAudioBlock, setAttributes, stopTicking ]
	);

	const pollOnce = useCallback(
		( id: number ) => {
			if ( startedAtRef.current && Date.now() - startedAtRef.current > CONFIG.poll.timeoutMs ) {
				stopTicking();
				setPhase( 'failed' );
				setError(
					__(
						'Timed out waiting for the narration to finish. Reload the editor to check on it — the credit may already have been used.',
						'jetpack-podcast'
					)
				);
				return;
			}

			// Authoritative status + completion come from the jobs endpoint
			// (it survives the active-job lock being cleared); chunk progress
			// is only on the GET activeJob record, fetched best-effort.
			apiCall< JobStatus >( { path: CONFIG.endpoints.jobStatus + id, method: 'GET' } )
				.then( job => {
					if ( job.status === 'complete' ) {
						finishWithJob( job );
					} else if ( job.status === 'failed' ) {
						stopTicking();
						setPhase( 'failed' );
						setError( __( 'Narration generation failed. Please try again.', 'jetpack-podcast' ) );
					}
				} )
				.catch( () => {
					/* transient poll error — keep ticking */
				} );

			apiCall< FeatureInfo >( { path: CONFIG.endpoints.featureInfo, method: 'GET' } )
				.then( latest => {
					const active = latest.activeJob as ActiveJob;
					if ( active && active.jobId === id && active.progress ) {
						setProgress( active.progress );
					}
				} )
				.catch( () => {
					/* progress is best-effort */
				} );
		},
		[ finishWithJob, stopTicking ]
	);

	const startTicking = useCallback(
		( id: number ) => {
			stopTicking();
			startedAtRef.current = Date.now();
			tickRef.current = setInterval( () => pollOnce( id ), CONFIG.poll.intervalMs );
		},
		[ pollOnce, stopTicking ]
	);

	// Load feature info on mount; resume an in-flight job for THIS post.
	useEffect( () => {
		let cancelled = false;
		apiCall< FeatureInfo >( { path: CONFIG.endpoints.featureInfo, method: 'GET' } )
			.then( data => {
				if ( cancelled ) {
					return;
				}
				setInfo( data );
				const active = data.activeJob as ActiveJob;
				if ( active && active.jobId && active.postId === postId ) {
					if ( active.status === 'complete' && active.audioUrl ) {
						finishWithJob( {
							jobId: active.jobId,
							status: 'complete',
							attachmentId: active.attachmentId,
							audioUrl: active.audioUrl,
						} );
						return;
					}
					if ( active.status === 'pending' ) {
						setProgress( active.progress || null );
						setPhase( 'running' );
						startTicking( active.jobId );
						return;
					}
				}
				if ( phase === 'loading' ) {
					setPhase( 'idle' );
				}
			} )
			.catch( () => {
				if ( ! cancelled && phase === 'loading' ) {
					setPhase( 'idle' );
				}
			} );
		return () => {
			cancelled = true;
			stopTicking();
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	const presets: Presets = info?.presets || { voices: [], styles: [], paces: [], music: [] };
	const quota = info?.quota;
	const upgradeUrl = info?.upgradeUrl || '';

	const defaults = CONFIG.defaults;
	const voice = attributes.voice || defaults.voice;
	const style = attributes.style || '';
	const pace = attributes.pace || '';
	const music = attributes.music || '';
	const gainMin = defaults.musicGainMin ?? 0.0;
	const gainMax = defaults.musicGainMax ?? 0.3;
	const defaultGain = defaults.musicGain ?? 0.1;
	const musicGain = typeof attributes.musicGain === 'number' ? attributes.musicGain : defaultGain;

	const generating = phase === 'running';
	const outOfCredits = !! quota && quota.remaining <= 0;
	// A job already running for a different post blocks Generate (one job/site).
	const otherActiveJob =
		!! info &&
		!! ( info.activeJob as ActiveJob ).jobId &&
		( info.activeJob as ActiveJob ).postId !== postId &&
		( info.activeJob as ActiveJob ).status === 'pending';

	function startJob() {
		if ( ! postId ) {
			setError( __( 'Save the post as a draft first so we have a post ID.', 'jetpack-podcast' ) );
			return;
		}

		setPhase( 'running' );
		setError( '' );
		setProgress( null );
		setAttributes( { voiceUsed: voice } );

		const data: Record< string, unknown > = { postId, voice, style, pace, music };
		if ( '' !== music ) {
			data.musicGain = musicGain;
		}
		if ( typeof attributes.editedText === 'string' && '' !== attributes.editedText.trim() ) {
			data.text = attributes.editedText;
		}

		apiCall< { jobId: number; quota?: Quota } >( {
			path: CONFIG.endpoints.enqueue,
			method: 'POST',
			data,
		} )
			.then( job => {
				if ( job.quota && info ) {
					setInfo( { ...info, quota: job.quota } );
				}
				startTicking( job.jobId );
			} )
			.catch( ( err: Error ) => {
				setPhase( 'failed' );
				setError( err.message || __( 'Could not start the narration.', 'jetpack-podcast' ) );
			} );
	}

	function refreshPreviewText() {
		if ( ! postId ) {
			setError( __( 'Save the post as a draft first.', 'jetpack-podcast' ) );
			return;
		}
		setError( '' );
		setLoadingPreview( true );
		apiCall< { text: string; wordCount: number; chunkCount: number; chunks: string[] } >( {
			path: CONFIG.endpoints.previewText,
			method: 'POST',
			data: { postId },
		} )
			.then( result => {
				setAttributes( { editedText: result.text || '' } );
				setPreviewMeta( {
					words: result.wordCount || 0,
					chunks: result.chunkCount || 0,
					chunkList: result.chunks || [],
				} );
			} )
			.catch( ( err: Error ) =>
				setError(
					__( 'Could not load preview:', 'jetpack-podcast' ) + ( err.message || 'unknown' )
				)
			)
			.finally( () => setLoadingPreview( false ) );
	}

	function rechunkCurrentText() {
		if ( ! postId ) {
			return;
		}
		setLoadingPreview( true );
		apiCall< { wordCount: number; chunkCount: number; chunks: string[] } >( {
			path: CONFIG.endpoints.previewText,
			method: 'POST',
			data: { postId, text: attributes.editedText || '' },
		} )
			.then( result =>
				setPreviewMeta( {
					words: result.wordCount || 0,
					chunks: result.chunkCount || 0,
					chunkList: result.chunks || [],
				} )
			)
			.catch( () => {
				/* non-fatal */
			} )
			.finally( () => setLoadingPreview( false ) );
	}

	function clearPreviewText() {
		setAttributes( { editedText: '' } );
		setPreviewMeta( null );
	}

	function reset() {
		setPhase( 'idle' );
		setError( '' );
		setProgress( null );
		setAttributes( { attachmentId: undefined, audioUrl: '' } );
	}

	const blockProps = useBlockProps( { className: 'wp-block-jetpack-post-to-audio' } );

	// -------------------- DONE --------------------
	if ( phase === 'done' && attributes.audioUrl ) {
		const usedVoice = attributes.voiceUsed || voice;
		const convertToAudioBlock = () => {
			if ( ! replaceWithAudioBlock( attributes.attachmentId, attributes.audioUrl ) ) {
				setError(
					__(
						'Could not insert the audio block automatically. Copy this URL and add a core Audio block manually:',
						'jetpack-podcast'
					) + attributes.audioUrl
				);
			}
		};
		return (
			<div { ...blockProps }>
				<figure className="wp-block-audio">
					{  }
					<audio controls src={ attributes.audioUrl } preload="none" />
				</figure>
				{ usedVoice && (
					<p className="jetpack-post-to-audio__voice-line">
						{ __( 'Voice:', 'jetpack-podcast' ) + ' ' + usedVoice }
					</p>
				) }
				<Notice status="info" isDismissible={ false }>
					{ __(
						'Done. Click "Insert as audio block" to replace this with a native audio block.',
						'jetpack-podcast'
					) }
				</Notice>
				{ error && (
					<Notice status="error" isDismissible={ true } onRemove={ () => setError( '' ) }>
						{ error }
					</Notice>
				) }
				<div className="jetpack-post-to-audio__done-actions">
					<Button variant="primary" onClick={ convertToAudioBlock }>
						{ __( 'Insert as audio block', 'jetpack-podcast' ) }
					</Button>
					<Button variant="tertiary" onClick={ reset }>
						{ __( 'Regenerate', 'jetpack-podcast' ) }
					</Button>
				</div>
			</div>
		);
	}

	// -------------------- CONFIGURE / RUN --------------------
	const voiceOptions = presets.voices.map( v => {
		const genderLabel =
			'F' === v.gender ? __( 'Female', 'jetpack-podcast' ) : __( 'Male', 'jetpack-podcast' );
		return { label: v.gender ? `${ v.name } — ${ genderLabel }` : v.name, value: v.name };
	} );
	if ( ! voiceOptions.length ) {
		voiceOptions.push( { label: voice, value: voice } );
	}

	let progressText = '';
	if ( generating && progress && progress.total ) {
		progressText = sprintf(
			/* translators: 1: chunks done, 2: total chunks. */
			__( '%1$d / %2$d chunks', 'jetpack-podcast' ),
			progress.done,
			progress.total
		);
	} else if ( generating ) {
		progressText = __( 'Generating…', 'jetpack-podcast' );
	}

	const btnLabel = generating
		? __( 'Generating…', 'jetpack-podcast' )
		: __( 'Generate audio', 'jetpack-podcast' );

	const summaryBits = [ voice ];
	const styleLabel = lookupLabel( presets.styles, style );
	const paceLabel = lookupLabel( presets.paces, pace );
	const musicLabel = lookupLabel( presets.music, music );
	if ( styleLabel ) {
		summaryBits.push( styleLabel );
	}
	if ( paceLabel ) {
		summaryBits.push( paceLabel );
	}
	if ( musicLabel ) {
		summaryBits.push( musicLabel + ' bed' );
	}

	const generateDisabled =
		generating || ! postId || outOfCredits || otherActiveJob || phase === 'loading';

	return (
		<Fragment>
			<InspectorControls>
				<PanelBody title={ __( 'Voice', 'jetpack-podcast' ) } initialOpen={ true }>
					<SelectControl
						label={ __( 'Voice', 'jetpack-podcast' ) }
						value={ voice }
						options={ voiceOptions }
						onChange={ v => setAttributes( { voice: v } ) }
						disabled={ generating }
						__nextHasNoMarginBottom
					/>
				</PanelBody>

				<PanelBody title={ __( 'Direction', 'jetpack-podcast' ) } initialOpen={ true }>
					<SelectControl
						label={ __( 'Style', 'jetpack-podcast' ) }
						value={ style }
						options={ [ { label: __( '— None —', 'jetpack-podcast' ), value: '' } ].concat(
							presets.styles.map( p => ( { label: p.label, value: p.key } ) )
						) }
						onChange={ s => setAttributes( { style: s } ) }
						disabled={ generating }
						help={ __( 'Tone the narrator should adopt.', 'jetpack-podcast' ) }
					/>
					<SelectControl
						label={ __( 'Pace', 'jetpack-podcast' ) }
						value={ pace }
						options={ [ { label: __( '— None —', 'jetpack-podcast' ), value: '' } ].concat(
							presets.paces.map( p => ( { label: p.label, value: p.key } ) )
						) }
						onChange={ p => setAttributes( { pace: p } ) }
						disabled={ generating }
						help={ __( 'Reading speed and rhythm.', 'jetpack-podcast' ) }
						__nextHasNoMarginBottom
					/>
				</PanelBody>

				<PanelBody title={ __( 'Background music', 'jetpack-podcast' ) } initialOpen={ false }>
					<SelectControl
						label={ __( 'Music style', 'jetpack-podcast' ) }
						value={ music }
						options={ [ { label: __( '— None —', 'jetpack-podcast' ), value: '' } ].concat(
							presets.music.map( p => ( { label: p.label, value: p.key } ) )
						) }
						onChange={ m => setAttributes( { music: m } ) }
						disabled={ generating }
						help={ __(
							'Instrumental bed via Lyria, looped under the voice. Non-fatal if it fails.',
							'jetpack-podcast'
						) }
					/>
					{ '' !== music && (
						<RangeControl
							label={ __( 'Music volume', 'jetpack-podcast' ) }
							value={ musicGain }
							min={ gainMin }
							max={ gainMax }
							step={ 0.01 }
							onChange={ v =>
								setAttributes( { musicGain: typeof v === 'number' ? v : defaultGain } )
							}
							disabled={ generating }
							help={ __(
								'Default 0.10. Above 0.20 starts to interfere with speech.',
								'jetpack-podcast'
							) }
							__nextHasNoMarginBottom
						/>
					) }
				</PanelBody>

				<PanelBody
					title={ __( 'Preview & edit narration', 'jetpack-podcast' ) }
					initialOpen={ false }
				>
					<div className="jetpack-post-to-audio__preview-panel">
						<Button
							variant="secondary"
							onClick={ refreshPreviewText }
							disabled={ generating || loadingPreview || ! postId }
							isBusy={ loadingPreview }
						>
							{ loadingPreview
								? __( 'Loading…', 'jetpack-podcast' )
								: __( 'Refresh from post', 'jetpack-podcast' ) }
						</Button>
						{ attributes.editedText && (
							<Button
								variant="secondary"
								onClick={ rechunkCurrentText }
								disabled={ generating || loadingPreview }
							>
								{ __( 'Re-chunk current text', 'jetpack-podcast' ) }
							</Button>
						) }
						{ attributes.editedText && (
							<Button
								variant="tertiary"
								isDestructive
								onClick={ clearPreviewText }
								disabled={ generating }
							>
								{ __( 'Clear (use server-side stripping)', 'jetpack-podcast' ) }
							</Button>
						) }
						{ previewMeta && (
							<span className="jetpack-post-to-audio__preview-meta">
								{ sprintf(
									/* translators: 1: word count, 2: chunk count. */
									__( '%1$d words, %2$d chunks', 'jetpack-podcast' ),
									previewMeta.words,
									previewMeta.chunks
								) }
							</span>
						) }
						<TextareaControl
							label={ __( 'Narration text', 'jetpack-podcast' ) }
							value={ attributes.editedText || '' }
							onChange={ v => setAttributes( { editedText: v } ) }
							rows={ 12 }
							disabled={ generating }
							help={
								attributes.editedText
									? __(
											'Sent verbatim. Server-side stripping is skipped while this field has content.',
											'jetpack-podcast'
									  )
									: __( 'Empty — the server will strip the post on Generate.', 'jetpack-podcast' )
							}
							__nextHasNoMarginBottom
						/>
						{ previewMeta && previewMeta.chunkList && previewMeta.chunkList.length > 0 && (
							<details className="jetpack-post-to-audio__chunk-list">
								<summary>
									{ sprintf(
										/* translators: %d: number of chunks. */
										__( 'Chunk breakdown (%d chunks)', 'jetpack-podcast' ),
										previewMeta.chunkList.length
									) }
								</summary>
								<div style={ { marginTop: '8px' } }>
									{ previewMeta.chunkList.map( ( chunkText, idx ) => {
										const trimmed = chunkText.trim();
										const words = trimmed.length ? trimmed.split( /\s+/ ).length : 0;
										return (
											<div key={ idx } className="jetpack-post-to-audio__chunk">
												<div className="jetpack-post-to-audio__chunk-heading">
													{ sprintf(
														/* translators: 1: chunk index (1-based), 2: word count. */
														__( 'Chunk %1$d — %2$d words', 'jetpack-podcast' ),
														idx + 1,
														words
													) }
												</div>
												{ trimmed }
											</div>
										);
									} ) }
								</div>
							</details>
						) }
					</div>
				</PanelBody>
			</InspectorControls>

			<div { ...blockProps }>
				<Placeholder
					icon={ <Icon icon="microphone" /> }
					label={ __( 'Post to Audio', 'jetpack-podcast' ) }
					instructions={ summaryBits.join( ' · ' ) }
				>
					{ error && (
						<Notice status="error" isDismissible={ true } onRemove={ () => setError( '' ) }>
							{ error }
						</Notice>
					) }

					{ ! postId && (
						<Notice status="warning" isDismissible={ false }>
							{ __( 'Save the post as a draft first.', 'jetpack-podcast' ) }
						</Notice>
					) }

					{ outOfCredits && (
						<Notice status="warning" isDismissible={ false }>
							{ __( "You've used all your audio generation credits.", 'jetpack-podcast' ) }
							{ upgradeUrl && (
								<Fragment>
									{ ' ' }
									<ExternalLink href={ upgradeUrl }>
										{ __( 'Upgrade for more', 'jetpack-podcast' ) }
									</ExternalLink>
								</Fragment>
							) }
						</Notice>
					) }

					{ otherActiveJob && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'Another narration job is already running on this site. Wait for it to finish before starting a new one.',
								'jetpack-podcast'
							) }
						</Notice>
					) }

					{ postId && ! generating && ! outOfCredits && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								'Generation can take a few minutes. You can leave this tab — reopen the editor to pick the job back up. Each run uses one audio credit.',
								'jetpack-podcast'
							) }
						</Notice>
					) }

					{ quota && (
						<p className="jetpack-post-to-audio__preview-meta">
							{ sprintf(
								/* translators: 1: remaining credits, 2: total credits. */
								__( '%1$d of %2$d audio credits remaining', 'jetpack-podcast' ),
								quota.remaining,
								quota.quota
							) }
						</p>
					) }

					<div className="jetpack-post-to-audio__actions">
						<Button variant="primary" onClick={ startJob } disabled={ generateDisabled }>
							{ generating ? (
								<Fragment>
									<Spinner /> { btnLabel }
								</Fragment>
							) : (
								btnLabel
							) }
						</Button>

						{ progressText && (
							<span className="jetpack-post-to-audio__progress">{ progressText }</span>
						) }
					</div>
				</Placeholder>
			</div>
		</Fragment>
	);
}
