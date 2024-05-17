import apiFetch from '@wordpress/api-fetch';
import { BlockControls, useBlockProps } from '@wordpress/block-editor';
import { getBlockType } from '@wordpress/blocks';
import { ToolbarGroup, ToolbarButton, withNotices } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { useEffect, useRef, useState } from '@wordpress/element';
import { __, _x, sprintf } from '@wordpress/i18n';
import { edit } from '@wordpress/icons';
import EmbedPlaceHolder from './embed-placeholder';
import Preview from './preview';

/**
 * Render children if there are any, otherwise show the default preview (iframe)
 *
 * @param {Element}     children
 * @param {Function}    children.mapUrl
 * @param {string}      children.url
 * @param {string}      children.className
 * @param {boolean}     children.interactive
 * @param {Function}    children.toggleInteractive
 * @returns {Element} preview element
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
	checkGoogleDocVisibility = false,
} ) => {
	useEffect( () => {
		if ( checkGoogleDocVisibility ) {
			apiFetch( { path: `/wpcom/v2/checkGoogleDocVisibility?url=${ url }` } ).catch( () => {
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
	}, [ url, checkGoogleDocVisibility, noticeOperations ] );

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
		mismatchErrorMessage = __( 'It does not look like an embeddable URL.', 'jetpack' ),
		label,
		mapUrl = url => url,
		noticeOperations,
		noticeUI,
		patterns,
		placeholder = __( 'Enter URL to embed here…', 'jetpack' ),
		children,
		onSubmitUrl = () => {},
		checkGoogleDocVisibility = false,
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
		className: 'wp-block-jetpack-google-docs-embed',
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
					checkGoogleDocVisibility={ checkGoogleDocVisibility }
				/>
			) }
		</div>
	);
};

export default compose( withNotices )( Edit );
