/* global verbumBlockEditor */
import clsx from 'clsx';
import { forwardRef, type TargetedEvent } from 'preact/compat';
import { useContext, useEffect, useState } from 'preact/hooks';
import { translate } from '../i18n';
import { VerbumSignals } from '../state';
import { isFastConnection } from '../utils';
import { EditorPlaceholder } from './editor-placeholder';

type CommentInputFieldProps = {
	handleOnKeyUp: () => void;
};

/**
 * Resize the textarea to fit the content.
 *
 * @param event - Event object.
 */
const resizeTextarea = ( event: TargetedEvent< HTMLTextAreaElement > ) => {
	event.currentTarget.style.height = 'auto';
	event.currentTarget.style.height = event.currentTarget.scrollHeight + 'px';
};

const embedContentCallback = ( embedUrl: string ) => {
	return {
		path: '/verbum/embed',
		query: `embed_url=${ encodeURIComponent( embedUrl ) }&embed_nonce=${ encodeURIComponent(
			VerbumComments.embedNonce
		) }`,
		apiNamespace: 'wpcom/v2',
	};
};

export const CommentInputField = forwardRef(
	(
		{ handleOnKeyUp }: CommentInputFieldProps,
		ref: React.MutableRefObject< HTMLTextAreaElement | null >
	) => {
		const { commentParent, commentValue } = useContext( VerbumSignals );
		const [ editorState, setEditorState ] = useState< 'LOADING' | 'LOADED' | 'ERROR' >( null );
		const [ isGBEditorEnabled, setIsGBEditorEnabled ] = useState( false );

		useEffect( () => {
			setTimeout( () => {
				setIsGBEditorEnabled( VerbumComments.enableBlocks && isFastConnection() );
			} );
		}, [] );

		/**
		 * Download the block editor.
		 */
		async function downloadEditor() {
			if ( editorState ) {
				return;
			}

			setEditorState( 'LOADING' );

			try {
				// Dynamically load the editor.
				// import requires an absolute URL when fetching from a CDN (cross origin fetch).
				await import(
					/* webpackIgnore: true */
					'https://widgets.wp.com/verbum-block-editor/block-editor.min.js?from=jetpack&ver=' +
						VerbumComments.vbeCacheBuster
				);
				verbumBlockEditor.attachGutenberg(
					ref.current,
					content => {
						commentValue.value = content;
						handleOnKeyUp();
					},
					VerbumComments.isRTL,
					embedContentCallback
				);
				// Wait fro the block editor to render.
				setTimeout( () => setEditorState( 'LOADED' ), 100 );
			} catch {
				// Switch to the textarea if the editor fails to load.
				setEditorState( 'ERROR' );
				setIsGBEditorEnabled( false );
			}
		}

		return (
			<div className="comment-form-field comment-textarea">
				<div
					id="comment-form-comment"
					className={ 'verbum-' + isGBEditorEnabled ? 'block-editor' : 'text-area' }
				>
					<>
						{ isGBEditorEnabled && editorState !== 'LOADED' && (
							<EditorPlaceholder onClick={ downloadEditor } loading={ editorState === 'LOADING' } />
						) }
						<textarea
							value={ commentValue.value }
							onInput={ ( event: TargetedEvent< HTMLTextAreaElement > ) => {
								resizeTextarea( event );
								commentValue.value = event.currentTarget.value;
							} }
							onKeyUp={ handleOnKeyUp }
							id="comment"
							name="comment"
							ref={ ref }
							className={ clsx( {
								'editor-enabled': isGBEditorEnabled,
							} ) }
							style={ {
								resize: 'none',
								width: '100%',
								overflow: 'hidden',
							} }
							placeholder={
								commentParent.value
									? translate( 'Write a reply...' )
									: translate( 'Write a comment...' )
							}
						></textarea>
					</>
				</div>
			</div>
		);
	}
);
