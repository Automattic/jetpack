import analytics from '@automattic/jetpack-analytics';
import JetpackLogo from '@automattic/jetpack-components/jetpack-logo';
import {
	getScriptData,
	getSiteData,
	getSiteType,
	isWpcomPlatformSite,
} from '@automattic/jetpack-script-data';
import apiFetch from '@wordpress/api-fetch';
import {
	createInterpolateElement,
	useCallback,
	useEffect,
	useMemo,
	useState,
} from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { Button, IconButton, Link, Stack, Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';

export default () => {
	const [ prompts, setPrompts ] = useState( [] );
	const [ index, setIndex ] = useState( 0 );
	const [ loaded, setLoaded ] = useState( false );

	// Get site type for analytics.
	const siteType = useMemo( () => getSiteType(), [] );

	// Initialize analytics with user data.
	useEffect( () => {
		const tracksUserData = getScriptData()?.newsletter?.tracksUserData;
		if ( tracksUserData && typeof tracksUserData === 'object' ) {
			analytics.initialize( tracksUserData.userid, tracksUserData.username );
		}
	}, [] );

	useEffect( () => {
		const now = new Date();
		const mm = String( now.getMonth() + 1 ).padStart( 2, '0' );
		const dd = String( now.getDate() ).padStart( 2, '0' );
		// See projects/packages/jetpack-mu-wpcom/src/features/wpcom-block-editor-nux/src/blogging-prompts-modal/index.js
		const path = addQueryArgs( `/wpcom/v3/blogging-prompts`, {
			per_page: 10,
			after: `--${ mm }-${ dd }`,
			order: 'desc',
			force_year: new Date().getFullYear(),
		} );
		apiFetch( { path } )
			.then( data => setPrompts( Array.isArray( data ) ? data : [] ) )
			.catch( () => {} )
			.finally( () => setLoaded( true ) );
	}, [] );

	const goToPrevious = useCallback( () => setIndex( current => current - 1 ), [] );
	const goToNext = useCallback( () => setIndex( current => current + 1 ), [] );
	const postAnswer = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_writing_prompt_post_answer_click', {
			site_type: siteType,
			prompt_id: prompts[ index ].id,
		} );
		document.location = `post-new.php?answer_prompt=${ prompts[ index ].id }`;
	}, [ prompts, index, siteType ] );
	const recordViewResponsesClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_writing_prompt_view_responses_click', {
			site_type: siteType,
			prompt_id: prompts[ index ].id,
		} );
	}, [ prompts, index, siteType ] );
	const recordReaderClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_writing_prompt_reader_click', {
			site_type: siteType,
		} );
	}, [ siteType ] );

	// Render nothing while the prompts are still loading so the widget stays
	// empty until we know whether we have a prompt to show. Once the fetch has
	// settled we always render the branding footer, even when no prompt came
	// back, so the widget never collapses to a blank box.
	if ( ! loaded ) {
		return null;
	}

	const hasPrompt = prompts.length > 0;
	const prompt = prompts[ index ];

	const blogId = getSiteData()?.wpcom?.blog_id;
	const readerUrl = addQueryArgs(
		'https://wordpress.com/reader',
		blogId ? { origin_site_id: blogId } : {}
	);
	const openReaderInNewTab = ! isWpcomPlatformSite();

	return (
		<Stack direction="column" gap="md">
			{ hasPrompt ? (
				<>
					<Stack
						className="wpcom-daily-writing-prompt--prompt"
						direction="row"
						align="flex-start"
						gap="sm"
					>
						<Text
							className="wpcom-daily-writing-prompt--prompt-text"
							variant="body-lg"
							render={ <p /> }
						>
							{ decodeEntities( prompt.text ) }
						</Text>
						<Stack
							className="wpcom-daily-writing-prompt--prompt-nav"
							direction="row"
							gap="xs"
							align="center"
						>
							<IconButton
								icon={ arrowLeft }
								label={ __( 'Previous prompt', 'jetpack-newsletter' ) }
								variant="outline"
								tone="neutral"
								size="compact"
								onClick={ goToPrevious }
								disabled={ index === 0 }
							/>
							<IconButton
								icon={ arrowRight }
								label={ __( 'Next prompt', 'jetpack-newsletter' ) }
								variant="outline"
								tone="neutral"
								size="compact"
								onClick={ goToNext }
								disabled={ index === prompts.length - 1 }
							/>
						</Stack>
					</Stack>
					<Stack direction="row" justify="space-between" align="center" gap="sm" wrap="wrap">
						<Button variant="outline" size="compact" onClick={ postAnswer }>
							{ __( 'Post your answer', 'jetpack-newsletter' ) }
						</Button>
						{ prompt.answered_users_sample.length > 0 && (
							<Stack
								className="wpcom-daily-writing-prompt--answered-users"
								direction="row"
								align="center"
								gap="sm"
							>
								<span>
									{ prompt.answered_users_sample.map( sample => {
										return (
											<img
												alt={ __( 'User avatar', 'jetpack-newsletter' ) }
												src={ addQueryArgs( sample.avatar, {
													s: 24 * 2,
												} ) }
												width={ 24 }
												height={ 24 }
												key={ sample.avatar }
											/>
										);
									} ) }
									{ prompt.answered_users_count > prompt.answered_users_sample.length && (
										<Text
											className="wpcom-daily-writing-prompt--answered-users-more"
											variant="body-sm"
										>
											{ `+${ prompt.answered_users_count - prompt.answered_users_sample.length }` }
										</Text>
									) }
								</span>
								{ prompt.answered_users_count > 0 && (
									<Link
										href={ new URL( prompt.answered_link ).toString() }
										openInNewTab
										rel="noreferrer noopener"
										onClick={ recordViewResponsesClick }
									>
										{ __( 'View responses', 'jetpack-newsletter' ) }
									</Link>
								) }
							</Stack>
						) }
					</Stack>
				</>
			) : (
				<Text variant="body-md" render={ <p /> }>
					{ createInterpolateElement(
						/* translators: the text inside the <a></a> tags is a link to the WordPress.com Reader. */
						__(
							'No writing prompt to show right now. Find more in <a>the Reader</a>.',
							'jetpack-newsletter'
						),
						{
							a: (
								<Link
									tone="neutral"
									href={ readerUrl }
									openInNewTab={ openReaderInNewTab }
									rel={ openReaderInNewTab ? 'noreferrer noopener' : undefined }
									onClick={ recordReaderClick }
								/>
							),
						}
					) }
				</Text>
			) }
			<Stack
				className="wpcom-daily-writing-prompt--branding"
				direction="row"
				justify="space-between"
				align="center"
				gap="sm"
				wrap="wrap"
			>
				<JetpackLogo logoColor="#000000" height={ 20 } />
				<Link
					tone="neutral"
					href={ readerUrl }
					openInNewTab={ openReaderInNewTab }
					rel={ openReaderInNewTab ? 'noreferrer noopener' : undefined }
					onClick={ recordReaderClick }
				>
					{ __( 'Read the blogs and topics you follow', 'jetpack-newsletter' ) }
				</Link>
			</Stack>
		</Stack>
	);
};
