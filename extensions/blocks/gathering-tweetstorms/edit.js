/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { BlockIcon } from '@wordpress/block-editor';
import { createBlock } from '@wordpress/blocks';
import { Button, Placeholder, withNotices, Spinner } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import icon from './icon';
import useGatherTweetstorm from './use-gather-tweetstorm';

function GatheringTweetstormsEdit( { className, noticeOperations, noticeUI, onReplace } ) {
	const [ url, setUrl ] = useState( '' );
	const [ submitted, setSubmitted ] = useState( false );

	const { blocks, isGatheringStorm } = useGatherTweetstorm( {
		url: submitted ? url : '',
		noticeOperations,
	} );

	if ( ! isEmpty( blocks ) ) {
		setSubmitted( false );

		onReplace(
			blocks.map( block => {
				switch ( block.type ) {
					case 'paragraph':
						return createBlock( 'core/paragraph', { content: block.content } );
					case 'gallery':
						return createBlock( 'core/gallery', { images: block.images } );
					case 'image':
						return createBlock( 'core/image', { url: block.url, alt: block.alt } );
					case 'video':
						return createBlock( 'core/video', { src: block.url, caption: block.alt } );
					case 'embed':
						return createBlock( 'core/embed', { url: block.url } );
				}
			} )
		);
	}

	const submitForm = event => {
		if ( event ) {
			event.preventDefault();
		}

		setSubmitted( true );
	};

	if ( isGatheringStorm ) {
		return (
			<div className="wp-block-embed is-loading">
				<Spinner />
				<p>{ __( 'Gathering tweets…', 'jetpack' ) }</p>
			</div>
		);
	}

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
						onChange={ event => setUrl( event.target.value ) }
						placeholder={ __( 'Tweet URL', 'jetpack' ) }
						value={ url }
						className="components-placeholder__input"
					/>
					<div>
						<Button isSecondary isLarge type="submit">
							{ _x( 'Gather Tweets', 'button label', 'jetpack' ) }
						</Button>
					</div>
				</form>
			</Placeholder>
		</div>
	);
}

export default withNotices( GatheringTweetstormsEdit );
