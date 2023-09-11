import { isAtomicSite, isSimpleSite } from '@automattic/jetpack-shared-extension-utils';
import { InspectorControls } from '@wordpress/block-editor';
import { getBlockDefaultClassName } from '@wordpress/blocks';
import { Placeholder, SandBox, Button, ExternalLink, withNotices } from '@wordpress/components';
import { compose } from '@wordpress/compose';
import { useEffect, useState } from '@wordpress/element';
import { __, _x } from '@wordpress/i18n';
import { withViewportMatch } from '@wordpress/viewport';
import GoogleCalendarInspectorControls from './controls';
import icon from './icon';
import { URL_REGEX, parseEmbed } from './utils';

export function GoogleCalendarEdit( props ) {
	const {
		attributes: { url, height },
		className,
		isMobile,
		isSelected,
		name,
		noticeOperations,
		noticeUI,
		setAttributes,
	} = props;

	const [ editedEmbed, setEditedEmbed ] = useState( url || '' );
	const [ editingUrl, setEditingUrl ] = useState( false );
	const [ interactive, setInteractive ] = useState( false );

	useEffect( () => {
		if ( ! isSelected && interactive ) {
			// We only want to change this when the block is not selected, because changing it when
			// the block becomes selected makes the overlap disappear too early. Hiding the overlay
			// happens on mouseup when the overlay is clicked.
			setInteractive( false );
		}
	}, [ isSelected, interactive ] );

	const hideOverlay = () => {
		// This is called onMouseUp on the overlay. We can't respond to the `isSelected` prop
		// changing, because that happens on mouse down, and the overlay immediately disappears,
		// and the mouse event can end up in the preview content. We can't use onClick on
		// the overlay to hide it either, because then the editor misses the mouseup event, and
		// thinks we're multi-selecting blocks.
		setInteractive( true );
	};

	const setErrorNotice = () => {
		noticeOperations.removeAllNotices();
		noticeOperations.createErrorNotice(
			__(
				"Your calendar couldn't be embedded. Please double check your URL or Embed Code. Please note, you need to use the 'Public URL' or 'Embed Code', the 'Shareable Link' will not work.",
				'jetpack'
			)
		);
	};

	const handleEmbed = event => {
		if ( event ) {
			event.preventDefault();
		}

		const newAttributes = parseEmbed( editedEmbed.trim() );

		if ( ! URL_REGEX.test( newAttributes.url ) ) {
			setErrorNotice();
			return;
		}

		setAttributes( newAttributes );
		setEditingUrl( false );
		noticeOperations.removeAllNotices();
	};

	const getEditForm = formClassName => (
		<form onSubmit={ handleEmbed } className={ formClassName }>
			<textarea
				type="text"
				value={ editedEmbed }
				className="components-placeholder__input"
				aria-label={ __( 'Google Calendar URL or iframe', 'jetpack' ) }
				placeholder={ __( 'Enter URL or iframe to embed here…', 'jetpack' ) }
				onChange={ event => setEditedEmbed( event.target.value ) }
			/>
			<Button variant="secondary" type="submit">
				{ _x( 'Embed', 'button label', 'jetpack' ) }
			</Button>
		</form>
	);

	const defaultClassName = getBlockDefaultClassName( name );
	const iframeHeight = isMobile ? '300' : height;

	const html = `<iframe src="${ url }" style="border:0" scrolling="no" frameborder="0" height="${ iframeHeight }"></iframe>`;

	const permissionsLink = (
		<ExternalLink href="https://en.support.wordpress.com/google-calendar/">
			{ __( 'Enable Permissions for the calendar you want to share', 'jetpack' ) }
		</ExternalLink>
	);

	const controls = (
		<InspectorControls>
			<GoogleCalendarInspectorControls
				className={ `${ defaultClassName }-embed-form-sidebar` }
				embedValue={ editedEmbed }
				onChange={ event => setEditedEmbed( event.target.value ) }
				onSubmit={ handleEmbed }
			/>
		</InspectorControls>
	);

	if ( editingUrl || ! url ) {
		const supportLink =
			isSimpleSite() || isAtomicSite()
				? 'https://en.support.wordpress.com/wordpress-editor/blocks/google-calendar/'
				: 'https://jetpack.com/support/jetpack-blocks/google-calendar/';

		return (
			<div className={ className }>
				{ controls }
				<Placeholder
					className={ className }
					label={ __( 'Google Calendar', 'jetpack' ) }
					icon={ icon }
					instructions={
						<ol className={ `${ defaultClassName }-placeholder-instructions` }>
							<li>{ permissionsLink }</li>
							<li>
								{ __(
									'Paste the embed code you copied from your Google Calendar below',
									'jetpack'
								) }
							</li>
						</ol>
					}
					notices={ noticeUI }
				>
					{ getEditForm( `${ defaultClassName }-embed-form-editor` ) }
					<div className={ `${ defaultClassName }-placeholder-links` }>
						<ExternalLink href={ supportLink }>{ __( 'Learn more', 'jetpack' ) }</ExternalLink>
					</div>
				</Placeholder>
			</div>
		);
	}

	// Disabled because the overlay div doesn't actually have a role or functionality
	// as far as the user is concerned. We're just catching the first click so that
	// the block can be selected without interacting with the embed preview that the overlay covers.
	/* eslint-disable jsx-a11y/no-static-element-interactions */
	return (
		<div className={ className }>
			{ controls }
			<div>
				<SandBox html={ html } onFocus={ hideOverlay } />
				{ ! interactive && (
					<div className="block-library-embed__interactive-overlay" onMouseUp={ hideOverlay } />
				) }
			</div>
		</div>
	);
}

export default compose(
	withNotices,
	withViewportMatch( { isMobile: '< small' } )
)( GoogleCalendarEdit );
