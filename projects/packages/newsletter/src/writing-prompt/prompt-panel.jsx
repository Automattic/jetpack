import analytics from '@automattic/jetpack-analytics';
import { isWpcomPlatformSite } from '@automattic/jetpack-script-data';
import { createInterpolateElement, useCallback, useState } from '@wordpress/element';
import { decodeEntities } from '@wordpress/html-entities';
import { __ } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { IconButton, Link, LinkButton, Stack, Text } from '@wordpress/ui';
import { addQueryArgs } from '@wordpress/url';

/**
 * The writing prompt view: one prompt at a time, with controls to browse the
 * other recent prompts and to answer the current one.
 *
 * @param {object}   props                    - Component props.
 * @param {object[]} props.prompts            - The prompts to browse through.
 * @param {string}   props.siteType           - The site type, for analytics.
 * @param {string}   props.readerUrl          - Where to send someone looking for more prompts.
 * @param {boolean}  props.openReaderInNewTab - Whether the Reader link should open in a new tab.
 * @param {Function} props.onReaderClick      - Called when the Reader link is clicked.
 * @return {import('react').ReactElement} The prompt panel.
 */
export default ( { prompts, siteType, readerUrl, openReaderInNewTab, onReaderClick } ) => {
	const [ index, setIndex ] = useState( 0 );

	const goToPrevious = useCallback( () => setIndex( current => current - 1 ), [] );
	const goToNext = useCallback( () => setIndex( current => current + 1 ), [] );
	const recordPostAnswerClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_writing_prompt_post_answer_click', {
			site_type: siteType,
			prompt_id: prompts[ index ].id,
		} );
	}, [ prompts, index, siteType ] );
	const recordViewResponsesClick = useCallback( () => {
		analytics.tracks.recordEvent( 'jetpack_newsletter_writing_prompt_view_responses_click', {
			site_type: siteType,
			prompt_id: prompts[ index ].id,
		} );
	}, [ prompts, index, siteType ] );

	if ( prompts.length === 0 ) {
		return (
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
								onClick={ onReaderClick }
							/>
						),
					}
				) }
			</Text>
		);
	}

	const prompt = prompts[ index ];

	// "Post your answer" opens the Write editor on WordPress.com-platform sites
	// (Simple/Atomic, where Write exists); on self-hosted it falls back to the
	// classic new-post screen, where the jetpack/blogging-prompt block editor
	// script seeds the same prompt.
	const postAnswerHref = isWpcomPlatformSite()
		? addQueryArgs( 'admin.php', { page: 'write', answer_prompt: prompt.id } )
		: addQueryArgs( 'post-new.php', { answer_prompt: prompt.id } );

	return (
		<Stack direction="column" gap="md">
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
				<LinkButton
					variant="outline"
					size="compact"
					href={ postAnswerHref }
					onClick={ recordPostAnswerClick }
				>
					{ __( 'Post your answer', 'jetpack-newsletter' ) }
				</LinkButton>
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
								<Text className="wpcom-daily-writing-prompt--answered-users-more" variant="body-sm">
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
		</Stack>
	);
};
