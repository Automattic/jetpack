/**
 * External dependencies
 */
import { __, _x } from '@wordpress/i18n';
import { BlockIcon } from '@wordpress/block-editor';
import { Button, Placeholder, withNotices, Spinner } from '@wordpress/components';
import { useState, useEffect } from '@wordpress/element';
import { isEmpty } from 'lodash';

/**
 * Internal dependencies
 */
import icon from './icon';
import useGatherTweetstorm from './use-gather-tweetstorm';

function GatheringTweetstormsEdit( { className, noticeOperations, noticeUI, onReplace } ) {
	const [ url, setUrl ] = useState( '' );
	const [ submitted, setSubmitted ] = useState( false );

	const { blocks, isGatheringStorm, unleashStorm } = useGatherTweetstorm( {
		url: submitted ? url : '',
		noticeOperations,
		onReplace,
	} );

	// If we've discovered blocks, replace the current block with those blocks.
	useEffect( () => {
		if ( ! isEmpty( blocks ) ) {
			setSubmitted( false );
			unleashStorm();
		}
	}, [ blocks, setSubmitted, unleashStorm ] );

	/**
	 * Event handler for when the form is submitted.
	 *
	 * @param {*} event - Event object.
	 */
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
