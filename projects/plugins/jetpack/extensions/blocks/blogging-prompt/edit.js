import apiFetch from '@wordpress/api-fetch';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { PanelBody, Spinner, ToggleControl, withNotices } from '@wordpress/components';
import { useDispatch, useSelect } from '@wordpress/data';
import { useEffect, useState } from '@wordpress/element';
import { escapeHTML } from '@wordpress/escape-html';
import { __, _x } from '@wordpress/i18n';
import './editor.scss';
import icon from './icon';

// Tries to create a term or fetch it if it already exists.
function findOrCreateTag( tagName ) {
	const escapedTagName = escapeHTML( tagName );

	return apiFetch( {
		path: `/wp/v2/tags`,
		method: 'POST',
		data: { name: escapedTagName },
	} ).catch( error => {
		if ( error.code !== 'term_exists' ) {
			return Promise.reject( error );
		}

		return Promise.resolve( {
			id: error.data.term_id,
			name: tagName,
		} );
	} );
}

function BloggingPromptsBetaEdit( { attributes, noticeOperations, noticeUI, setAttributes } ) {
	const [ isLoading, setLoading ] = useState( true );
	const { gravatars, prompt, promptId, showLabel, showResponses } = attributes;
	const blockProps = useBlockProps( { className: 'jetpack-blogging-prompts' } );
	const { editPost } = useDispatch( 'core/editor' );

	const { terms, termIds, hasResolvedTerms } = useSelect( select => {
		const { getEditedPostAttribute } = select( 'core/editor' );
		const { getEntityRecords, hasFinishedResolution } = select( 'core' );
		const _termIds = getEditedPostAttribute( 'tags' );

		const query = {
			_fields: 'id,name',
			context: 'view',
			include: _termIds.join( ',' ),
			per_page: -1,
		};

		return {
			termIds: _termIds,
			terms: _termIds.length ? getEntityRecords( 'taxonomy', 'post_tag', query ) : [],
			hasResolvedTerms: hasFinishedResolution( 'getEntityRecords', [
				'taxonomy',
				'post_tag',
				query,
			] ),
		};
	}, [] );

	useEffect( () => {
		if ( ! hasResolvedTerms ) {
			return;
		}

		if ( null !== terms && ! terms.some( term => term.name && 'dailyprompt' === term.name ) ) {
			findOrCreateTag( 'dailyprompt' ).then( term => {
				editPost( { tags: [ ...termIds, term.id ] } );
			} );
		}
	}, [ editPost, hasResolvedTerms, terms, termIds ] );

	useEffect( () => {
		// If not initially rendering the block, don't fetch new data.
		if ( ! isLoading ) {
			return;
		}

		let path = '/wpcom/v3/blogging-prompts';

		if ( promptId ) {
			path += '/' + encodeURIComponent( promptId );
		} else {
			const date = new Date();

			// Current month and day with leading zeros.
			const month = ( date.getMonth() + 1 ).toString().padStart( 2, '0' );
			const day = date.getDate().toString().padStart( 2, '0' );

			path += `?after=--${ month }-${ day }&order=desc`;
		}

		apiFetch( { path } )
			.then( prompts => {
				const promptData = promptId ? prompts : prompts[ 0 ];

				setLoading( false );
				setAttributes( {
					gravatars: promptData.answered_users_sample.map( ( { avatar } ) => ( { url: avatar } ) ),
					prompt: promptData.text,
					promptId: promptData.id,
				} );
			} )
			.catch( error => {
				setLoading( false );
				noticeOperations.removeAllNotices();
				noticeOperations.createErrorNotice( error.message );
			} );
	}, [ isLoading, noticeOperations, promptId, setAttributes, setLoading ] );

	const onShowLabelChange = newValue => {
		setAttributes( { showLabel: newValue } );
	};

	const onShowResponsesChange = newValue => {
		setAttributes( { showResponses: newValue } );
	};

	const renderControls = () => (
		<>
			<InspectorControls>
				<PanelBody title={ _x( 'Settings', 'title of block settings sidebar section', 'jetpack' ) }>
					<ToggleControl
						label={ __( 'Show daily prompt label', 'jetpack' ) }
						checked={ showLabel }
						onChange={ onShowLabelChange }
					/>
					<ToggleControl
						label={ __( 'Show other responses', 'jetpack' ) }
						checked={ showResponses }
						onChange={ onShowResponsesChange }
					/>
				</PanelBody>
			</InspectorControls>
		</>
	);

	const renderPrompt = () => (
		<>
			{ showLabel && (
				<div className="jetpack-blogging-prompts__label">
					{ icon }
					{ __( 'Daily writing prompt', 'jetpack' ) }
				</div>
			) }

			<div className="jetpack-blogging-prompts__prompt">{ prompt }</div>

			{ showResponses && (
				<div className="jetpack-blogging-prompts__answers">
					{ gravatars &&
						gravatars.slice( 0, 3 ).map( ( { url } ) => {
							return (
								url && (
									// eslint-disable-next-line jsx-a11y/alt-text
									<img
										className="jetpack-blogging-prompts__answers-gravatar"
										// Gravatar are decorative, here.
										src={ url }
										key={ url }
									/>
								)
							);
						} ) }

					<a
						className="jetpack-blogging-prompts__answers-link"
						href={ `https://wordpress.com/tag/dailyprompt-${ promptId }` }
						target="_blank"
						rel="noreferrer"
					>
						{ __( 'View all responses', 'jetpack' ) }
					</a>
				</div>
			) }
		</>
	);

	return (
		<div { ...blockProps }>
			{ noticeUI }
			{ renderControls() }

			{ isLoading ? (
				<div className="jetpack-blogging-prompts__spinner">
					<Spinner />
				</div>
			) : (
				renderPrompt()
			) }
		</div>
	);
}

export default withNotices( BloggingPromptsBetaEdit );
