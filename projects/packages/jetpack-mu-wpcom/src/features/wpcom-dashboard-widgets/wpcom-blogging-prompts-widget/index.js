import { __ } from '@wordpress/i18n';
import { wpcomTrackEvent } from '../../../common/tracks';
import { useBloggingPrompts } from '../../wpcom-blogging-prompts/hooks/use-blogging-prompts';

import './style.scss';

const WpcomBloggingPromptsWidget = ( { siteId, siteAdminUrl } ) => {
	const {
		prompt,
		todayPrompt,
		hasPreviousPrompt,
		goToPreviousPrompt,
		hasNextPrompt,
		goToNextPrompt,
	} = useBloggingPrompts( { isBloganuary: false } );

	const handlePromptClick = e => {
		e.preventDefault();

		if ( prompt.answered ) {
			return;
		}

		// TODO: Track event
		// eslint-disable-next-line no-constant-condition
		if ( 1 === 0 ) {
			wpcomTrackEvent( 'xxx_answer_prompt', {
				site_id: siteId,
				prompt_id: prompt.id,
			} );
		}

		// Track if a user skipped todays prompt and choose to answer another prompt
		const todayPromptId = todayPrompt.id;
		const selectedPromptId = prompt.id;
		if ( todayPromptId !== selectedPromptId ) {
			// TODO: Track event
			// eslint-disable-next-line no-constant-condition
			if ( 1 === 0 ) {
				wpcomTrackEvent( 'xxx_skip_prompt', {
					site_id: siteId,
					prompt_id: todayPromptId,
				} );
			}
		}

		window.location.href = `${ siteAdminUrl }post-new.php?answer_prompt=${ prompt.id }`;
	};

	if ( ! prompt ) {
		return null;
	}

	return (
		<>
			<div className="wpcom-blogging-prompts-widget__prompt">
				{ hasPreviousPrompt ? (
					<a
						href="#"
						className="wpcom-blogging-prompts-widget__prompt--prev"
						onClick={ goToPreviousPrompt }
					></a>
				) : (
					<span className="wpcom-blogging-prompts-widget__prompt--prev disabled"></span>
				) }
				<p>{ prompt.text }</p>
				{ hasNextPrompt ? (
					<a
						href="#"
						className="wpcom-blogging-prompts-widget__prompt--next"
						onClick={ goToNextPrompt }
					></a>
				) : (
					<span className="wpcom-blogging-prompts-widget__prompt--next disabled"></span>
				) }
			</div>
			<div className="wpcom-blogging-prompts-widget__actions">
				<button className="button button-primary" onClick={ handlePromptClick }>
					{ __( 'Post Answer', 'jetpack-mu-wpcom' ) }
				</button>
				{ prompt.answered_users_sample.length > 0 && (
					<div className="wpcom-blogging-prompts-widget__responses">
						<div className="wpcom-blogging-prompts-widget__responses-users">
							{ prompt.answered_users_sample.map( sample => {
								return <img alt="answered-users" src={ sample.avatar } key={ sample.avatar } />;
							} ) }
						</div>
						{ prompt?.answered_users_count > 0 && (
							<a href={ new URL( prompt.answered_link ) }>
								{ __( 'View all responses', 'jetpack-mu-wpcom' ) }
							</a>
						) }
					</div>
				) }
			</div>
		</>
	);
};

export default WpcomBloggingPromptsWidget;
