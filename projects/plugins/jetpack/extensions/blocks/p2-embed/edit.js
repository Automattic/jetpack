/**
 * Internal dependencies
 */
import './style.scss';
import Preview from './preview';
import EmbedPlaceHolder from './embed-placeholder';

/**
 * WordPress dependencies
 */
import { __, _x, sprintf } from '@wordpress/i18n';
import { compose } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';
import { BlockControls, useBlockProps } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { edit } from '@wordpress/icons';
import { ToolbarGroup, ToolbarButton, withNotices } from '@wordpress/components';
import apiFetch from '@wordpress/api-fetch';

/**
 * Render children if there are any, otherwise show the default preview (iframe)
 *
 * @param {JSX.Element} children
 * @param {Function}    mapUrl
 * @param {string}      url
 * @param {string}      className
 * @param {boolean}     interactive
 * @param {Function}    toggleInteractive
 * @returns {JSX.Element} preview element
 */
const RenderPreview = ( {
	children,
	mapUrl,
	url,
	className,
	interactive,
	toggleInteractive,
	noticeUI = null,
	noticeOperations = {},
	checkDocumentVisibility = false,
} ) => {
	useEffect( () => {
		if ( checkDocumentVisibility ) {
			apiFetch( { path: `/gsuite/v1/checkDocumentVisibility?url=${ url }` } ).catch( () => {
				noticeOperations.removeAllNotices();
				noticeOperations.createNotice( {
					status: 'warning',
					content: __(
						'This document is private. Only readers logged into a Google account that the document is shared with can view it.',
						'jetpack'
					),
				} );
			} );
		}
	}, [ url, checkDocumentVisibility, noticeOperations ] );

	if ( children ) {
		return children;
	}

	let isPrivateURL = false;
	if ( noticeUI ) {
		isPrivateURL = true;
	}

	return (
		<>
			{ noticeUI }
			<Preview
				url={ mapUrl( url ) }
				className={ className }
				interactive={ interactive }
				toggleInteractive={ toggleInteractive }
				isPrivateURL={ isPrivateURL }
			/>
		</>
	);
};

const Edit = props => {
	const {
		attributes,
		className,
		isSelected,
		setAttributes,
		icon = 'superhero-alt',
		instructions = __( 'Paste a link to the content you want to display.', 'jetpack' ),
		forceEditing = false,
		mismatchErrorMessage = 'It does not look like an embeddable URL.',
		label,
		mapUrl = url => url,
		noticeOperations,
		noticeUI,
		patterns,
		placeholder = __( 'Enter URL to embed here…', 'jetpack' ),
		children,
		onSubmitUrl = () => {},
		checkDocumentVisibility = false,
	} = props;

	const { url: attributesUrl } = attributes;
	const [ editing, toggleEditing ] = useState( false );
	const [ interactive, toggleInteractive ] = useState( false );
	const [ url, updateUrl ] = useState( attributesUrl );

	if ( forceEditing && ! editing ) {
		toggleEditing( true );
	}

	const onEditModeToggle = () => {
		noticeOperations.removeAllNotices();
		toggleEditing( ! editing );
	};
	const onSubmit = event => {
		if ( event ) {
			event.preventDefault();
		}

		if ( ! patterns[ 0 ].test( url ) ) {
			noticeOperations.removeAllNotices();
			noticeOperations.createErrorNotice( mismatchErrorMessage );
			return;
		}
		noticeOperations.removeAllNotices();

		toggleEditing( false );
		setAttributes( { url } );
		onSubmitUrl( url );
	};

	// Bring back the overlay after block gets deselected.
	useEffect( () => {
		if ( ! isSelected && interactive ) {
			toggleInteractive( false );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ isSelected ] );
	const ref = useRef( null );
	const blockProps = useBlockProps( {
		className: 'wp-block-p2-embed',
		ref,
	} );
	const { title } = getBlockType( props.name );
	const defaultLabel = sprintf(
		/* translators: %s is replaced with the name of the embed provider */
		_x( '%s URL', 'placeholder label', 'jetpack' ),
		title
	);

	return (
		<div { ...blockProps }>
			<BlockControls>
				<ToolbarGroup>
					{ ! editing && (
						<ToolbarButton
							icon={ edit }
							label={ __( 'Edit URL', 'jetpack' ) }
							isActive={ editing }
							onClick={ onEditModeToggle }
						/>
					) }
				</ToolbarGroup>
			</BlockControls>
			{ editing || ! attributesUrl ? (
				<EmbedPlaceHolder
					className={ className }
					icon={ icon }
					instructions={ instructions }
					label={ label || defaultLabel }
					url={ url }
					notices={ noticeUI }
					placeholder={ placeholder }
					onSubmit={ onSubmit }
					updateUrl={ updateUrl }
				/>
			) : (
				<RenderPreview
					children={ children }
					mapUrl={ mapUrl }
					url={ url }
					className={ className }
					interactive={ interactive }
					toggleInteractive={ toggleInteractive }
					noticeUI={ noticeUI }
					noticeOperations={ noticeOperations }
					checkDocumentVisibility={ checkDocumentVisibility }
				/>
			) }
		</div>
	);
};

export default compose( withNotices )( Edit );
