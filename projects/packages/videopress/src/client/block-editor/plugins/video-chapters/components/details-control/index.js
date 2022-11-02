/**
 * External dependencies
 */
import { Button, Notice, PanelBody, TextareaControl, TextControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { useState } from 'react';
/**
 * Internal dependencies
 */
import './index.scss';

const CHARACTERS_PER_LINE = 31;

/**
 * React component that renders a Video details control
 *
 * @param {object} props                        - Component properties.
 * @param {object} props.attributes             - Block attributes.
 * @param {boolean} props.isRequestingVideoData - Whether the video data is being requested.
 * @param {Function} props.setAttributes - Block attributes setter.
 * @returns {object} Video details control component
 */
export default function DetailsControl( { attributes, setAttributes, isRequestingVideoData } ) {
	const { title, description } = attributes;
	const isBeta = true;
	const [ dismiss, setDismiss ] = useState( false );

	const onRemove = () => {
		setDismiss( true );
	};

	// Expands the description textarea to accommodate the description
	const minRows = 4;
	const maxRows = 12;
	const rows = description?.length
		? description
				.split( '\n' )
				.map( line => Math.ceil( line.length / CHARACTERS_PER_LINE ) || 1 )
				.reduce( ( sum, current ) => sum + current, 0 )
		: minRows;

	const descriptionControlRows = Math.min( maxRows, Math.max( rows, minRows ) );

	const setTitleAttribute = newTitle => {
		setAttributes( { title: newTitle } );
	};

	const setDescriptionAttribute = newDescription => {
		setAttributes( { description: newDescription } );
	};

	return (
		<PanelBody
			title={ __( 'Details', 'jetpack-videopress-pkg' ) }
			className={ isBeta ? 'is-beta' : '' }
		>
			<TextControl
				label={ __( 'Title', 'jetpack-videopress-pkg' ) }
				value={ title }
				placeholder={ __( 'Video title', 'jetpack-videopress-pkg' ) }
				onChange={ setTitleAttribute }
				disabled={ isRequestingVideoData }
			/>

			<TextareaControl
				label={ __( 'Description', 'jetpack-videopress-pkg' ) }
				value={ description }
				placeholder={ __( 'Video description', 'jetpack-videopress-pkg' ) }
				help={ __(
					'These details are reflected wherever the video is shown.',
					'jetpack-videopress-pkg'
				) }
				onChange={ setDescriptionAttribute }
				rows={ descriptionControlRows }
				disabled={ isRequestingVideoData }
			/>

			{ ! dismiss && !! attributes.tracks.length && (
				<Notice
					className={ 'jetpack-videopress-videochapters-prompt' }
					status={ 'success' }
					isDismissable={ true }
					onRemove={ onRemove }
				>
					<p>
						{ __( 'We detected chapters in your video Description', 'jetpack-videopress-pkg' ) }
					</p>

					<Button variant="primary">
						{ __( 'Add chapters list to post', 'jetpack-videopress-pkg' ) }
					</Button>
				</Notice>
			) }
		</PanelBody>
	);
}
