import { getAdminUrl } from '@automattic/jetpack-script-data';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Notice,
	SelectControl,
	TextareaControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControl as ToggleGroupControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalToggleGroupControlOption as ToggleGroupControlOption,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useEffect, useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import PostsPicker from './posts-picker';
import { LENGTH_PRESETS, VOICE_PRESETS, WINDOW_PRESETS } from './presets';
import './style.scss';
import {
	usePostsToPodcastInfo,
	usePostsToPodcastJob,
	type GenerateParams,
} from './use-posts-to-podcast';

type SourceMode = 'window' | 'posts';

const editPostUrl = ( postId: number ): string =>
	`${ getAdminUrl( 'post.php' ) }?action=edit&post=${ postId }`;

const PostsToPodcastSection = () => {
	const [ sourceMode, setSourceMode ] = useState< SourceMode >( 'window' );
	const [ windowId, setWindowId ] = useState( WINDOW_PRESETS[ 0 ].id );
	const [ selectedPostIds, setSelectedPostIds ] = useState< number[] >( [] );
	const [ lengthId, setLengthId ] = useState( LENGTH_PRESETS[ 1 ].id );
	const [ voiceId, setVoiceId ] = useState( VOICE_PRESETS[ 0 ].id );
	const [ prompt, setPrompt ] = useState( '' );

	const { status, result, error, generate, reset } = usePostsToPodcastJob();
	const {
		data: featureInfo,
		isLoading: featureInfoLoading,
		refetch: refetchFeatureInfo,
	} = usePostsToPodcastInfo();

	const isPolling = status === 'polling';
	const succeeded = status === 'succeeded';

	// Credits decrement on enqueue; refetch once a job lands a draft.
	useEffect( () => {
		if ( succeeded ) {
			refetchFeatureInfo();
		}
	}, [ succeeded, refetchFeatureInfo ] );

	const remaining = featureInfo?.remainingCredits;
	const total = featureInfo?.totalCredits;
	const hasCredits = remaining === undefined ? true : remaining > 0;

	const sourceReady =
		sourceMode === 'window' || ( sourceMode === 'posts' && selectedPostIds.length > 0 );
	const disableGenerate = isPolling || ! sourceReady || ! hasCredits;

	const handleSourceModeChange = useCallback( ( value: string | number | undefined ) => {
		setSourceMode( ( value as SourceMode ) ?? 'window' );
	}, [] );

	const onGenerate = useCallback( (): void => {
		const params: GenerateParams = {
			length: lengthId,
			voicePreset: voiceId,
		};

		if ( sourceMode === 'window' ) {
			const preset = WINDOW_PRESETS.find( p => p.id === windowId );
			if ( ! preset ) {
				return;
			}
			params.window = { unit: preset.unit, n: preset.n };
		} else {
			if ( selectedPostIds.length === 0 ) {
				return;
			}
			params.postIds = selectedPostIds;
		}

		const trimmedPrompt = prompt.trim();
		if ( trimmedPrompt ) {
			params.prompt = trimmedPrompt;
		}

		void generate( params );
	}, [ sourceMode, windowId, selectedPostIds, lengthId, voiceId, prompt, generate ] );

	return (
		<Card>
			<CardHeader>
				<h2 className="podcast__section-heading">
					{ __( 'Generate episode', 'jetpack-podcast' ) }
				</h2>
			</CardHeader>
			<CardBody>
				<VStack spacing={ 4 }>
					<Text variant="muted">
						{ __(
							"Generate a podcast-style episode draft from your site's posts. Pick a source, a length, and a voice; the result lands as a draft you can edit and publish.",
							'jetpack-podcast'
						) }
					</Text>

					<ToggleGroupControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						isBlock
						label={ __( 'Source', 'jetpack-podcast' ) }
						value={ sourceMode }
						onChange={ handleSourceModeChange }
						disabled={ isPolling }
					>
						<ToggleGroupControlOption
							value="window"
							label={ __( 'From recent posts', 'jetpack-podcast' ) }
						/>
						<ToggleGroupControlOption
							value="posts"
							label={ __( 'Pick posts', 'jetpack-podcast' ) }
						/>
					</ToggleGroupControl>

					{ sourceMode === 'window' && (
						<SelectControl
							__next40pxDefaultSize
							__nextHasNoMarginBottom
							label={ __( 'Window', 'jetpack-podcast' ) }
							value={ windowId }
							onChange={ setWindowId }
							disabled={ isPolling }
							options={ WINDOW_PRESETS.map( p => ( { label: p.label, value: p.id } ) ) }
							help={ __( 'Which posts to draw from.', 'jetpack-podcast' ) }
						/>
					) }

					{ sourceMode === 'posts' && (
						<PostsPicker
							selectedIds={ selectedPostIds }
							onChange={ setSelectedPostIds }
							disabled={ isPolling }
							maxSelection={ 20 }
						/>
					) }

					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Length', 'jetpack-podcast' ) }
						value={ lengthId }
						onChange={ setLengthId }
						disabled={ isPolling }
						options={ LENGTH_PRESETS.map( p => ( { label: p.label, value: p.id } ) ) }
					/>

					<SelectControl
						__next40pxDefaultSize
						__nextHasNoMarginBottom
						label={ __( 'Voice', 'jetpack-podcast' ) }
						value={ voiceId }
						onChange={ setVoiceId }
						disabled={ isPolling }
						options={ VOICE_PRESETS.map( p => ( { label: p.label, value: p.id } ) ) }
					/>

					<TextareaControl
						__nextHasNoMarginBottom
						label={ __( 'Additional instructions', 'jetpack-podcast' ) }
						value={ prompt }
						onChange={ setPrompt }
						disabled={ isPolling }
						rows={ 3 }
						help={ __(
							'Optional. Steer the tone, framing, or focus of the generated episode.',
							'jetpack-podcast'
						) }
					/>

					<VStack spacing={ 2 } alignment="flex-start">
						<Button variant="primary" onClick={ onGenerate } disabled={ disableGenerate }>
							{ isPolling
								? __( 'Generating…', 'jetpack-podcast' )
								: __( 'Generate', 'jetpack-podcast' ) }
						</Button>
						{ ! featureInfoLoading && remaining !== undefined && (
							<Text variant="muted">
								{ total !== undefined
									? sprintf(
											/* translators: 1: remaining credits, 2: monthly cap. */
											__( '%1$d of %2$d generations remaining this month.', 'jetpack-podcast' ),
											remaining,
											total
									  )
									: sprintf(
											/* translators: %d: remaining credits. */
											__( '%d generations remaining this month.', 'jetpack-podcast' ),
											remaining
									  ) }
							</Text>
						) }
					</VStack>

					{ ! hasCredits && (
						<Notice status="warning" isDismissible={ false }>
							{ __(
								"You've used all generations for this billing period. New credits unlock at the next reset.",
								'jetpack-podcast'
							) }
						</Notice>
					) }

					{ isPolling && (
						<Notice status="info" isDismissible={ false }>
							{ __(
								'Generating episode script — this usually takes 2–3 minutes. You can leave this page and come back.',
								'jetpack-podcast'
							) }
						</Notice>
					) }

					{ status === 'succeeded' && result?.postId && (
						<Notice status="success" onRemove={ reset }>
							{ __( 'Draft created.', 'jetpack-podcast' ) }{ ' ' }
							<Link href={ editPostUrl( result.postId ) }>
								{ __( 'Open draft', 'jetpack-podcast' ) }
							</Link>
						</Notice>
					) }

					{ status === 'failed' && (
						<Notice status="error" onRemove={ reset }>
							{ error || __( 'Generation failed. Please try again.', 'jetpack-podcast' ) }
						</Notice>
					) }
				</VStack>
			</CardBody>
		</Card>
	);
};

export default PostsToPodcastSection;
