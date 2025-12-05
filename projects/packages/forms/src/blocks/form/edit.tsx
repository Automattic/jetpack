/**
 * WordPress dependencies
 */
import { useInnerBlocksProps, useBlockProps, Warning } from '@wordpress/block-editor';
import { Spinner } from '@wordpress/components';
import { useEntityBlockEditor, useEntityRecord } from '@wordpress/core-data';
import { __ } from '@wordpress/i18n';

type FormEditProps = {
	attributes: {
		ref?: number;
	};
};

export default function FormEdit( { attributes }: FormEditProps ) {
	const { ref } = attributes;

	// Fetch the form post from the jetpack-form post type
	const { record, hasResolved } = useEntityRecord( 'postType', 'jetpack-form', ref );

	// Get the blocks from the form post
	const [ blocks, onInput, onChange ] = useEntityBlockEditor( 'postType', 'jetpack-form', {
		id: ref,
	} );

	// Check if the form is missing
	const isMissing = hasResolved && ! record;

	// Get the block props for the wrapper
	const blockProps = useBlockProps( {
		className: 'wp-block-jetpack-form',
	} );

	// Get inner blocks props for rendering the form blocks
	const innerBlocksProps = useInnerBlocksProps( blockProps, {
		value: blocks,
		onInput,
		onChange,
		renderAppender: blocks?.length ? undefined : () => null,
	} );

	// Loading state
	if ( ! hasResolved ) {
		return (
			<div { ...blockProps }>
				<Spinner />
			</div>
		);
	}

	// Missing or invalid form
	if ( isMissing ) {
		return (
			<div { ...blockProps }>
				<Warning>{ __( 'Form not found. Please select a valid form.', 'jetpack-forms' ) }</Warning>
			</div>
		);
	}

	// No ref specified
	if ( ! ref ) {
		return (
			<div { ...blockProps }>
				<Warning>{ __( 'No form selected. Please select a form.', 'jetpack-forms' ) }</Warning>
			</div>
		);
	}

	// Render the form blocks
	return <div { ...innerBlocksProps } />;
}
