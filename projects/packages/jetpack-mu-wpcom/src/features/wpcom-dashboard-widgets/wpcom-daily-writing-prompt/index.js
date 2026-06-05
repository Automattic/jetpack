import apiFetch from '@wordpress/api-fetch';
import { useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Button, Link, Stack, Text } from '@wordpress/ui';
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
		<Stack direction="column" gap="md">
			<Stack className="wpcom-daily-writing-prompt--prompt" direction="column" gap="md">
				<Text variant="body-md" render={ <p /> }>
					{ prompt.text }
				</Text>
				<Stack direction="row" justify="flex-end">
					<Button
						variant="minimal"
						size="small"
						onClick={ () => setIndex( index - 1 ) }
						disabled={ index === 0 }
					>
						{ __( '← Previous', 'jetpack-mu-wpcom' ) }
					</Button>
					<Button
						variant="minimal"
						size="small"
						onClick={ () => setIndex( index + 1 ) }
						disabled={ index === prompts.length - 1 }
					>
						{ __( 'Next →', 'jetpack-mu-wpcom' ) }
					</Button>
				</Stack>
			</Stack>
			<Stack direction="row" justify="space-between" align="center" gap="sm" wrap="wrap">
				{ /* Replace with LinkButton once available: https://github.com/WordPress/gutenberg/issues/77098 */ }
				<Button
					variant="outline"
					size="compact"
					onClick={ () => {
						document.location = `post-new.php?answer_prompt=${ prompt.id }`;
					} }
				>
					{ __( 'Post Answer', 'jetpack-mu-wpcom' ) }
				</Button>
				{ prompt.answered_users_sample.length > 0 && (
					<Stack
						className="wpcom-daily-writing-prompt--answered-users"
						direction="row"
						align="center"
						gap="xs"
					>
						{ prompt.answered_users_count > 0 && (
							<Link href={ new URL( prompt.answered_link ).toString() }>
								{ __( 'View all responses', 'jetpack-mu-wpcom' ) }
							</Link>
						) }
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
					</Stack>
				) }
			</Stack>
		</Stack>
	);
};
