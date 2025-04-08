import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';

import './style.scss';

export default () => {
	const [ prompts, setPrompts ] = useState( [] );
	const [ index, setIndex ] = useState( 0 );
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
		apiFetch( { path } ).then( setPrompts );
	}, [] );

	if ( prompts.length === 0 ) {
		return null;
	}

	const prompt = prompts[ index ];

	return (
		<>
			<div className="wpcom-daily-writing-prompt--prompt">
				<p>{ prompt.text }</p>
				<div className="wpcom-daily-writing-prompt--previous-next">
					<button
						className="button button-link"
						onClick={ () => setIndex( index - 1 ) }
						disabled={ index === 0 }
					>
						{ __( '← Previous', 'jetpack-mu-wpcom' ) }
					</button>
					{ ' ' }
					<button
						className="button button-link"
						onClick={ () => setIndex( index + 1 ) }
						disabled={ index === prompts.length - 1 }
					>
						{ __( 'Next →', 'jetpack-mu-wpcom' ) }
					</button>
				</div>
			</div>
			<div className="wpcom-daily-writing-prompt--action-row">
				<a className="button" href={ `post-new.php?answer_prompt=${ prompt.id }` }>
					{ __( 'Post Answer', 'jetpack-mu-wpcom' ) }
				</a>
				{ prompt.answered_users_sample.length > 0 && (
					<div className="wpcom-daily-writing-prompt--answered-users">
						{ prompt.answered_users_count > 0 && (
							<a href={ new URL( prompt.answered_link ) }>
								{ __( 'View all responses', 'jetpack-mu-wpcom' ) }
							</a>
						) }{ ' ' }
						<span>
							{ prompt.answered_users_sample.map( sample => {
								return (
									<img
										alt={ __( 'User avatar', 'jetpack-mu-wpcom' ) }
										src={ addQueryArgs( sample.avatar, {
											s: 22 * 2,
										} ) }
										width={ 22 }
										height={ 22 }
										key={ sample.avatar }
									/>
								);
							} ) }
						</span>
					</div>
				) }
			</div>
		</>
	);
};
