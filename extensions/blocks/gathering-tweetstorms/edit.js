/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { BlockIcon } from '@wordpress/block-editor';
import { Button, Placeholder, withNotices } from '@wordpress/components';
import { useState } from '@wordpress/element';

/**
 * Internal dependencies
 */
import './editor.scss';
import icon from './icon';

function GatheringTweetstormsEdit( {
	attributes,
	className,
	noticeOperations,
	noticeUI,
	setAttributes,
} ) {
	/**
	 * Write the block editor UI.
	 *
	 * @returns {object} The UI displayed when user edits this block.
	 */
	const [ embedUrl, setEmbedUrl ] = useState( '' );

	/* Call this function when you want to show an error in the placeholder. */
	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice( __( 'Put error message here.', 'jetpack' ) );
	};

	const submitForm = () => {};

	return (
		<div className={ className }>
			<Placeholder
				label={ __( 'Gathering Tweetstorms', 'jetpack' ) }
				icon={ <BlockIcon icon={ icon } /> }
				notices={ noticeUI }
			>
				<form onSubmit={ submitForm }>
					<input
						type="text"
						id="embedCode"
						onChange={ event => setEmbedUrl( event.target.value ) }
						placeholder={ __( 'Tweet URL', 'jetpack' ) }
						value={ embedUrl }
						className="components-placeholder__input"
					/>
					<div>
						<Button isSecondary isLarge type="submit">
							{ _x( 'Gather Tweetstorm', 'button label', 'jetpack' ) }
						</Button>
					</div>
				</form>
			</Placeholder>
		</div>
	);
}

export default GatheringTweetstormsEdit;
