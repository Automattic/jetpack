import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { BlockControls, useBlockProps } from '@wordpress/block-editor';
import { getBlockDefaultClassName } from '@wordpress/blocks';
import {
	Button,
	Placeholder,
	ToolbarGroup,
	ToolbarButton,
	withNotices,
} from '@wordpress/components';
import { useEffect, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { pencil } from '@wordpress/icons';
import { Link } from '@wordpress/ui';
import metadata from './block.json';
import { getEmbedUrl, normalizeUrl } from './utils';

const HELP_URL = 'https://support.zoom.com/hc/en/article?id=zm_kb&sysparm_article=KB0083594';
// Keep in sync with the IFRAME_HEIGHT in render.php and min-block-size in view.scss.
const IFRAME_HEIGHT = 900;
// Mirror the sandbox applied to the front-end iframe in render.php.
const IFRAME_SANDBOX = 'allow-scripts allow-same-origin allow-popups allow-forms';
const icon = getBlockIconComponent( metadata );

export function ZoomSchedulerEdit( props ) {
	const {
		attributes: { url },
		isSelected,
		name,
		noticeOperations,
		noticeUI,
		setAttributes,
	} = props;
	const blockProps = useBlockProps();
	const defaultClassName = getBlockDefaultClassName( name );
	const [ editedUrl, setEditedUrl ] = useState( url || '' );
	const [ editingUrl, setEditingUrl ] = useState( ! url );
	const [ interactive, setInteractive ] = useState( false );

	useEffect( () => {
		setEditedUrl( url || '' );
	}, [ url ] );

	useEffect( () => {
		if ( ! isSelected && interactive ) {
			setInteractive( false );
		}
	}, [ interactive, isSelected ] );

	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(
			__( "Your calendar couldn't be embedded. Please double check your URL or code.", 'jetpack' )
		);
	};

	const handleEmbed = event => {
		if ( event ) {
			event.preventDefault();
		}

		const normalizedUrl = normalizeUrl( editedUrl );
		if ( ! normalizedUrl ) {
			setErrorNotice();
			return;
		}

		setAttributes( { url: normalizedUrl } );
		setEditingUrl( false );
		noticeOperations.removeAllNotices();
	};

	const hideOverlay = () => {
		setInteractive( true );
	};

	const embedUrl = url ? getEmbedUrl( url ) : undefined;

	const editControls =
		url && ! editingUrl ? (
			<BlockControls>
				<ToolbarGroup>
					<ToolbarButton
						icon={ pencil }
						label={ __( 'Edit URL', 'jetpack' ) }
						onClick={ () => setEditingUrl( true ) }
					/>
				</ToolbarGroup>
			</BlockControls>
		) : null;

	const blockPlaceholder = (
		<Placeholder
			label={ __( 'Zoom Scheduler', 'jetpack' ) }
			instructions={ __( 'Paste your Zoom Scheduler booking page URL below.', 'jetpack' ) }
			icon={ icon }
			notices={ noticeUI }
		>
			<form onSubmit={ handleEmbed } className={ `${ defaultClassName }-embed-form` }>
				<input
					type="text"
					value={ editedUrl }
					className="components-placeholder__input"
					aria-label={ __( 'Zoom Scheduler URL', 'jetpack' ) }
					placeholder={ __( 'https://scheduler.zoom.us/your-name/discovery-call', 'jetpack' ) }
					onChange={ event => setEditedUrl( event.target.value ) }
				/>
				<Button variant="secondary" type="submit">
					{ _x( 'Embed', 'button label', 'jetpack' ) }
				</Button>
			</form>
			<div className={ `${ defaultClassName }-help` }>
				<Link openInNewTab href={ HELP_URL }>
					{ __( 'Find your Zoom Scheduler booking page URL', 'jetpack' ) }
				</Link>
			</div>
		</Placeholder>
	);

	const blockPreview = embedUrl ? (
		// Disabled because the overlay div doesn't actually have a role or functionality
		// as far as the user is concerned. We're just catching the first click so that
		// the block can be selected without interacting with the embed preview that the overlay covers.
		/* eslint-disable jsx-a11y/no-static-element-interactions */
		<div className={ `${ defaultClassName }-preview` }>
			<div className={ `${ defaultClassName }__embed` }>
				<iframe
					src={ embedUrl }
					title={ __( 'Zoom Scheduler', 'jetpack' ) }
					width="100%"
					height={ IFRAME_HEIGHT }
					frameBorder="0"
					sandbox={ IFRAME_SANDBOX }
				></iframe>
			</div>
			{ ! interactive && (
				<div className="block-library-embed__interactive-overlay" onMouseUp={ hideOverlay } />
			) }
		</div>
	) : (
		blockPlaceholder
	);

	return (
		<div { ...blockProps }>
			{ editControls }
			{ editingUrl || ! url ? blockPlaceholder : blockPreview }
		</div>
	);
}

export default withNotices( ZoomSchedulerEdit );
