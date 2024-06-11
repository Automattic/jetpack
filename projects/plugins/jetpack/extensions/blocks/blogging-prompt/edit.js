import apiFetch from '@wordpress/api-fetch';
import { InspectorControls, useBlockProps } from '@wordpress/block-editor';
import { Button, PanelBody, Spinner, ToggleControl, withNotices } from '@wordpress/components';
import { useSelect } from '@wordpress/data';
import { useEffect, useRef } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { addQueryArgs } from '@wordpress/url';
import clsx from 'clsx';
import './editor.scss';
import { usePromptTags } from './use-prompt-tags';

function BloggingPromptEdit( { attributes, noticeOperations, noticeUI, setAttributes } ) {
	// Use the ref to keep track of starting to fetch the prompt, so we don't make duplicate requests.
	const fetchingPromptRef = useRef( false );
	const {
		answersLink,
		answersLinkText,
		gravatars,
		// Use the attribute the track when we've finished fetching the prompt.
		promptFetched,
		promptId,
		promptLabel,
		promptText,
		showLabel,
		showResponses,
		tagsAdded,
		isBloganuary,
	} = attributes;
	const blockProps = useBlockProps( { className: 'jetpack-blogging-prompt' } );

	const setTagsAdded = state => setAttributes( { tagsAdded: state } );

	// Add the prompt tags to the post, if they haven't already been added.
	usePromptTags( promptId, tagsAdded, setTagsAdded );

	const siteLanguage = useSelect( select => {
		const { getEntityRecord, hasFinishedResolution } = select( 'core' );
		const language = getEntityRecord( 'root', 'site' )?.language || 'en_US';
		const hasFinishedResolving = hasFinishedResolution( 'getEntityRecord', [ 'root', 'site' ] );
		return hasFinishedResolving ? language : null;
	}, [] );

	// Fetch the prompt by id, if present, otherwise the get the prompt for today.
	useEffect( () => {
		// Only fetch the prompt one time when the block is inserted, after we know the site language.
		if ( ! siteLanguage || fetchingPromptRef.current || promptFetched ) {
			return;
		}

		const retryPrompt = () => {
			setAttributes( { promptFetched: false, promptId: null, tagsAdded: false } );
			fetchingPromptRef.current = false;
			noticeOperations.removeAllNotices();
		};

		const errorMessage = message => (
			<>
				{ sprintf(
					/* translators: %s is the error message. */
					__( 'Error while fetching prompt: %s', 'jetpack' ),
					message
				) }{ ' ' }
				<Button variant="link" onClick={ retryPrompt }>
					{ __( 'Retry', 'jetpack' ) }
				</Button>
			</>
		);

		const notFoundMessage = pId => (
			<>
				{ sprintf(
					/* translators: %d is the prompt id. */
					__( 'Prompt with id %d not found.', 'jetpack' ),
					pId
				) }{ ' ' }
				<Button variant="link" onClick={ retryPrompt }>
					{ __( 'Reset prompt', 'jetpack' ) }
				</Button>
			</>
		);

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

		path = addQueryArgs( path, {
			_locale: siteLanguage,
			force_year: new Date()?.getFullYear(),
		} );
		fetchingPromptRef.current = true;
		apiFetch( { path } )
			.then( prompts => {
				const promptData = promptId ? prompts : prompts[ 0 ];

				setAttributes( {
					answersLink: promptData.answered_link,
					answersLinkText: promptData.answered_link_text,
					gravatars: promptData.answered_users_sample.map( ( { avatar } ) => ( { url: avatar } ) ),
					promptFetched: true,
					promptLabel: promptData.label,
					promptText: promptData.text,
					promptId: promptData.id,
					isBloganuary: !! promptData.bloganuary_id,
				} );
			} )
			.catch( error => {
				setAttributes( { promptFetched: true } );
				const message =
					error.code === 'rest_post_invalid_id' && promptId
						? notFoundMessage( promptId )
						: errorMessage( error.message );
				noticeOperations.removeAllNotices();
				noticeOperations.createErrorNotice( message );
			} );
	}, [
		fetchingPromptRef,
		noticeOperations,
		promptFetched,
		promptId,
		setAttributes,
		siteLanguage,
	] );

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
						label={ __( 'Show prompt label', 'jetpack' ) }
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
	const labelClassnames = clsx( [ 'jetpack-blogging-prompt__label' ], {
		'is-bloganuary-icon': isBloganuary,
	} );

	const renderPrompt = () => (
		<>
			{ showLabel && <div className={ labelClassnames }>{ promptLabel }</div> }

			<div className="jetpack-blogging-prompt__text">{ promptText }</div>

			{ showResponses && promptId && (
				<div className="jetpack-blogging-prompt__answers">
					{ gravatars &&
						gravatars.slice( 0, 3 ).map( ( { url } ) => {
							return (
								url && (
									// eslint-disable-next-line jsx-a11y/alt-text
									<img
										className="jetpack-blogging-prompt__answers-gravatar"
										// Gravatar are decorative, here.
										src={ url }
										key={ url }
									/>
								)
							);
						} ) }

					<a
						className="jetpack-blogging-prompt__answers-link"
						href={ answersLink }
						target="_blank"
						rel="external noreferrer noopener"
					>
						{ answersLinkText }
					</a>
				</div>
			) }
		</>
	);

	return (
		<div { ...blockProps }>
			{ noticeUI }
			{ renderControls() }

			{ ! promptFetched ? (
				<div className="jetpack-blogging-prompt__spinner">
					<Spinner />
				</div>
			) : (
				renderPrompt()
			) }
		</div>
	);
}

export default withNotices( BloggingPromptEdit );
