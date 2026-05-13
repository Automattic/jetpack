import { getAdminUrl } from '@automattic/jetpack-script-data';
import {
	Button,
	Card,
	CardBody,
	CardHeader,
	Notice,
	SelectControl,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalText as Text,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';
import { useCallback, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Link } from '@wordpress/ui';
import { LENGTH_PRESETS, VOICE_PRESETS, WINDOW_PRESETS } from './presets';
import { usePostsToPodcastJob } from './use-posts-to-podcast';

const editPostUrl = ( postId: number ): string =>
	`${ getAdminUrl( 'post.php' ) }?action=edit&post=${ postId }`;

const PostsToPodcastSection = () => {
	const [ windowId, setWindowId ] = useState( WINDOW_PRESETS[ 0 ].id );
	const [ lengthId, setLengthId ] = useState( LENGTH_PRESETS[ 1 ].id );
	const [ voiceId, setVoiceId ] = useState( VOICE_PRESETS[ 0 ].id );

	const { status, result, error, generate, reset } = usePostsToPodcastJob();

	const isPolling = status === 'polling';

	const onGenerate = useCallback( (): void => {
		const preset = WINDOW_PRESETS.find( p => p.id === windowId );
		if ( ! preset ) {
			return;
		}
		void generate( {
			window: { unit: preset.unit, n: preset.n },
			length: lengthId,
			voicePreset: voiceId,
		} );
	}, [ windowId, lengthId, voiceId, generate ] );

	return (
		<Card>
			<CardHeader>
				<h2 className="podcast__section-heading">
					{ __( 'Generate episode from recent posts', 'jetpack-podcast' ) }
				</h2>
			</CardHeader>
			<CardBody>
				<VStack spacing={ 4 }>
					<Text variant="muted">
						{ __(
							"Generate a podcast-style episode draft from your site's recent activity. Pick a window, a length, and a voice; the result lands as a draft you can edit and publish.",
							'jetpack-podcast'
						) }
					</Text>

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

					<div>
						<Button variant="primary" onClick={ onGenerate } disabled={ isPolling }>
							{ isPolling
								? __( 'Generating…', 'jetpack-podcast' )
								: __( 'Generate', 'jetpack-podcast' ) }
						</Button>
					</div>

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
