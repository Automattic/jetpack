/**
 * Media Editor Page JavaScript - Fullscreen with Sidebar
 *
 * This file renders a complete MediaEditor React component with fullscreen layout and sidebar.
 */

// Import WordPress packages
const { createElement, useState, useEffect, useRef } = wp.element;
const { render } = wp.element;
const { useEntityRecord } = wp.coreData;
const { Notice, Spinner, Button, Panel, PanelBody, TextControl, ToggleControl } = wp.components;
const { __ } = wp.i18n;

// Fullscreen MediaEditor with Sidebar
function FullscreenMediaEditor( {
	postType = 'attachment',
	postId,
	setPostId,
	isPreview = false,
} ) {
	const { record, isResolving, hasResolved } = useEntityRecord( 'postType', postType, postId );
	const [ sidebarOpen, setSidebarOpen ] = useState( true );
	const [ activeTab, setActiveTab ] = useState( 'details' );
	// Always fullscreen by default
	const isFullscreen = true;

	// Handle keyboard events
	useEffect( () => {
		const handleKeyDown = event => {
			if ( event.key === 'Escape' ) {
				const settingsPanel = document.getElementById( 'jetpack-settings-panel' );
				if ( settingsPanel ) {
					const isVisible = settingsPanel.style.display !== 'none';
					settingsPanel.style.display = isVisible ? 'none' : 'block';
				}
			}
		};

		document.addEventListener( 'keydown', handleKeyDown );
		return () => document.removeEventListener( 'keydown', handleKeyDown );
	}, [] );

	if ( isResolving ) {
		return createElement(
			'div',
			{ className: 'media-editor-loading' },
			createElement( Spinner ),
			createElement( 'p', null, __( 'Loading media…', 'jetpack' ) )
		);
	}

	if ( hasResolved && ! record ) {
		return createElement(
			Notice,
			{ status: 'error', isDismissible: false },
			__( "You attempted to edit an item that doesn't exist. Perhaps it was deleted?", 'jetpack' )
		);
	}

	if ( ! record ) {
		return createElement(
			'div',
			{ className: 'media-editor-no-data' },
			createElement( 'p', null, __( 'No media data available.', 'jetpack' ) )
		);
	}

	// Media Editor Header
	const renderHeader = () =>
		createElement(
			'div',
			{ className: 'media-editor-header' },
			createElement(
				'div',
				{ className: 'media-editor-header-left' },
				createElement( 'h1', null, __( 'Media Editor', 'jetpack' ) ),
				createElement( 'span', { className: 'media-editor-id' }, `Current ID: ${ record.id }` )
			),
			createElement(
				'div',
				{ className: 'media-editor-header-center' },
				createElement(
					'label',
					{
						htmlFor: 'quick-post-id',
						style: { marginRight: '8px', fontSize: '14px', fontWeight: '500' },
					},
					__( 'Post ID:', 'jetpack' )
				),
				createElement( 'input', {
					id: 'quick-post-id',
					type: 'number',
					value: postId,
					onChange: e => {
						const newPostId = e.target.value.trim();
						if ( newPostId && /^\d+$/.test( newPostId ) ) {
							setPostId( newPostId );
							// Update URL parameter
							const url = new URL( window.location );
							url.searchParams.set( 'post_id', newPostId );
							window.history.replaceState( {}, '', url );
							// Update the settings form input too
							const settingInput = document.getElementById( 'custom_setting' );
							if ( settingInput ) {
								settingInput.value = newPostId;
							}
						}
					},
					style: {
						width: '80px',
						padding: '4px 8px',
						border: '1px solid #ddd',
						borderRadius: '3px',
						fontSize: '14px',
					},
				} ),
				createElement( Button, {
					variant: 'secondary',
					size: 'small',
					onClick: () => {
						// Navigate to previous ID
						const currentId = parseInt( postId );
						if ( currentId > 1 ) {
							const newId = ( currentId - 1 ).toString();
							setPostId( newId );
							const url = new URL( window.location );
							url.searchParams.set( 'post_id', newId );
							window.history.replaceState( {}, '', url );
							document.getElementById( 'quick-post-id' ).value = newId;
							const settingInput = document.getElementById( 'custom_setting' );
							if ( settingInput ) settingInput.value = newId;
						}
					},
					text: '←',
				} ),
				createElement( Button, {
					variant: 'secondary',
					size: 'small',
					onClick: () => {
						// Navigate to next ID
						const currentId = parseInt( postId );
						const newId = ( currentId + 1 ).toString();
						setPostId( newId );
						const url = new URL( window.location );
						url.searchParams.set( 'post_id', newId );
						window.history.replaceState( {}, '', url );
						document.getElementById( 'quick-post-id' ).value = newId;
						const settingInput = document.getElementById( 'custom_setting' );
						if ( settingInput ) settingInput.value = newId;
					},
					text: '→',
				} )
			),
			createElement(
				'div',
				{ className: 'media-editor-header-right' },
				createElement( Button, {
					variant: 'secondary',
					onClick: () => setSidebarOpen( ! sidebarOpen ),
					text: sidebarOpen ? __( 'Hide Sidebar', 'jetpack' ) : __( 'Show Sidebar', 'jetpack' ),
				} ),
				createElement( Button, {
					variant: 'secondary',
					onClick: () => {
						const settingsPanel = document.getElementById( 'jetpack-settings-panel' );
						if ( settingsPanel ) {
							settingsPanel.style.display =
								settingsPanel.style.display === 'none' ? 'block' : 'none';
						}
					},
					text: __( 'Settings', 'jetpack' ),
				} )
			)
		);

	// Media Editor Canvas (main content area)
	const renderCanvas = () =>
		createElement(
			'div',
			{ className: 'media-editor-canvas' },
			// Floating sidebar toggle button
			createElement(
				'button',
				{
					className: 'floating-sidebar-toggle',
					onClick: () => setSidebarOpen( ! sidebarOpen ),
					style: {
						position: 'absolute',
						top: '15px',
						right: sidebarOpen ? '310px' : '15px',
						zIndex: 1000,
						padding: '6px 10px',
						background: 'rgba(0, 0, 0, 0.7)',
						color: 'white',
						border: 'none',
						borderRadius: '3px',
						fontSize: '11px',
						cursor: 'pointer',
						transition: 'all 0.3s ease',
					},
				},
				sidebarOpen ? '→' : '←'
			),
			createElement(
				'div',
				{ className: 'media-preview-container' },
				record.mime_type && record.mime_type.startsWith( 'image/' )
					? createElement( 'img', {
							src: record.source_url,
							alt: record.alt_text || record.title?.rendered || '',
							className: 'media-preview-image',
					  } )
					: createElement(
							'div',
							{ className: 'media-preview-placeholder' },
							createElement( 'div', { className: 'media-icon' }, '📄' ),
							createElement(
								'p',
								null,
								record.title?.rendered || record.title || __( 'Untitled', 'jetpack' )
							),
							createElement(
								'p',
								{ className: 'media-type' },
								record.mime_type || __( 'Unknown type', 'jetpack' )
							)
					  )
			)
		);

	// Sidebar Details Tab
	const renderDetailsTab = () =>
		createElement(
			Panel,
			null,
			createElement(
				PanelBody,
				{ title: __( 'Quick Controls', 'jetpack' ), initialOpen: true },
				createElement(
					'div',
					{ style: { display: 'flex', flexDirection: 'column', gap: '12px' } },
					createElement(
						'div',
						{ style: { display: 'flex', alignItems: 'center', gap: '8px' } },
						createElement(
							'label',
							{
								htmlFor: 'sidebar-post-id',
								style: { fontSize: '13px', fontWeight: '500', minWidth: '50px' },
							},
							__( 'Post ID:', 'jetpack' )
						),
						createElement( 'input', {
							id: 'sidebar-post-id',
							type: 'number',
							value: postId,
							onChange: e => {
								const newPostId = e.target.value.trim();
								if ( newPostId && /^\d+$/.test( newPostId ) ) {
									setPostId( newPostId );
									const url = new URL( window.location );
									url.searchParams.set( 'post_id', newPostId );
									window.history.replaceState( {}, '', url );
									const settingInput = document.getElementById( 'custom_setting' );
									if ( settingInput ) settingInput.value = newPostId;
								}
							},
							style: {
								flex: 1,
								padding: '6px 8px',
								border: '1px solid #ddd',
								borderRadius: '3px',
								fontSize: '13px',
							},
						} )
					),
					createElement(
						'div',
						{ style: { display: 'flex', gap: '8px' } },
						createElement( Button, {
							variant: 'secondary',
							size: 'small',
							onClick: () => {
								const currentId = parseInt( postId );
								if ( currentId > 1 ) {
									const newId = ( currentId - 1 ).toString();
									setPostId( newId );
									const url = new URL( window.location );
									url.searchParams.set( 'post_id', newId );
									window.history.replaceState( {}, '', url );
									document.getElementById( 'sidebar-post-id' ).value = newId;
									const settingInput = document.getElementById( 'custom_setting' );
									if ( settingInput ) settingInput.value = newId;
								}
							},
							text: __( '← Previous', 'jetpack' ),
						} ),
						createElement( Button, {
							variant: 'secondary',
							size: 'small',
							onClick: () => {
								const currentId = parseInt( postId );
								const newId = ( currentId + 1 ).toString();
								setPostId( newId );
								const url = new URL( window.location );
								url.searchParams.set( 'post_id', newId );
								window.history.replaceState( {}, '', url );
								document.getElementById( 'sidebar-post-id' ).value = newId;
								const settingInput = document.getElementById( 'custom_setting' );
								if ( settingInput ) settingInput.value = newId;
							},
							text: __( 'Next →', 'jetpack' ),
						} )
					),
					createElement( Button, {
						variant: 'secondary',
						onClick: () => {
							const settingsPanel = document.getElementById( 'jetpack-settings-panel' );
							if ( settingsPanel ) {
								settingsPanel.style.display =
									settingsPanel.style.display === 'none' ? 'block' : 'none';
							}
						},
						text: __( 'Settings', 'jetpack' ),
					} )
				)
			),
			createElement(
				PanelBody,
				{ title: __( 'Media Details', 'jetpack' ), initialOpen: true },
				createElement(
					'div',
					{ className: 'media-details-grid' },
					createElement(
						'div',
						{ className: 'detail-item' },
						createElement( 'strong', null, __( 'Title:', 'jetpack' ) ),
						createElement(
							'div',
							null,
							record.title?.rendered || record.title || __( 'Untitled', 'jetpack' )
						)
					),
					createElement(
						'div',
						{ className: 'detail-item' },
						createElement( 'strong', null, __( 'File name:', 'jetpack' ) ),
						createElement( 'div', null, record.slug || __( 'Unknown', 'jetpack' ) )
					),
					createElement(
						'div',
						{ className: 'detail-item' },
						createElement( 'strong', null, __( 'File type:', 'jetpack' ) ),
						createElement( 'div', null, record.mime_type || __( 'Unknown', 'jetpack' ) )
					),
					createElement(
						'div',
						{ className: 'detail-item' },
						createElement( 'strong', null, __( 'Uploaded:', 'jetpack' ) ),
						createElement(
							'div',
							null,
							record.date
								? new Date( record.date ).toLocaleDateString()
								: __( 'Unknown', 'jetpack' )
						)
					),
					record.media_details &&
						createElement(
							'div',
							{ className: 'detail-item' },
							createElement( 'strong', null, __( 'Dimensions:', 'jetpack' ) ),
							createElement(
								'div',
								null,
								`${ record.media_details.width || 0 } × ${ record.media_details.height || 0 }`
							)
						),
					record.media_details &&
						record.media_details.filesize &&
						createElement(
							'div',
							{ className: 'detail-item' },
							createElement( 'strong', null, __( 'File size:', 'jetpack' ) ),
							createElement(
								'div',
								null,
								`${ Math.round( record.media_details.filesize / 1024 ) } KB`
							)
						)
				)
			),
			createElement(
				PanelBody,
				{ title: __( 'Alternative Text', 'jetpack' ), initialOpen: false },
				createElement( TextControl, {
					value: record.alt_text || '',
					onChange: () => {}, // TODO: Implement save functionality
					help: __( 'Describe the purpose of the image for screen readers.', 'jetpack' ),
				} )
			),
			createElement(
				PanelBody,
				{ title: __( 'Caption', 'jetpack' ), initialOpen: false },
				createElement( TextControl, {
					value: record.caption?.rendered || record.caption || '',
					onChange: () => {}, // TODO: Implement save functionality
					help: __( 'Visible caption for this image.', 'jetpack' ),
				} )
			)
		);

	// Sidebar Edit Tab (for images)
	const renderEditTab = () =>
		createElement(
			Panel,
			null,
			createElement(
				PanelBody,
				{ title: __( 'Image Editing', 'jetpack' ), initialOpen: true },
				createElement( 'p', null, __( 'Image editing tools coming soon…', 'jetpack' ) ),
				createElement( Button, {
					variant: 'secondary',
					text: __( 'Crop', 'jetpack' ),
					disabled: true,
				} ),
				createElement( 'br' ),
				createElement( 'br' ),
				createElement( Button, {
					variant: 'secondary',
					text: __( 'Rotate', 'jetpack' ),
					disabled: true,
				} ),
				createElement( 'br' ),
				createElement( 'br' ),
				createElement( Button, {
					variant: 'secondary',
					text: __( 'Flip', 'jetpack' ),
					disabled: true,
				} )
			)
		);

	// Sidebar Component
	const renderSidebar = () => {
		if ( ! sidebarOpen ) return null;

		const isImage = record.mime_type && record.mime_type.startsWith( 'image/' );

		return createElement(
			'div',
			{ className: 'media-editor-sidebar' },
			createElement(
				'div',
				{ className: 'sidebar-header' },
				createElement(
					'div',
					{ className: 'sidebar-tabs' },
					createElement( Button, {
						variant: activeTab === 'details' ? 'primary' : 'secondary',
						onClick: () => setActiveTab( 'details' ),
						text: __( 'Details', 'jetpack' ),
					} ),
					isImage &&
						createElement( Button, {
							variant: activeTab === 'edit' ? 'primary' : 'secondary',
							onClick: () => setActiveTab( 'edit' ),
							text: __( 'Edit', 'jetpack' ),
						} )
				)
			),
			createElement(
				'div',
				{ className: 'sidebar-content' },
				activeTab === 'details' ? renderDetailsTab() : renderEditTab()
			)
		);
	};

	// Main layout - No header
	return createElement(
		'div',
		{
			className: `media-editor-layout ${ isFullscreen ? 'is-fullscreen' : '' } ${
				sidebarOpen ? 'has-sidebar' : 'no-sidebar'
			}`,
		},
		createElement(
			'div',
			{ className: 'media-editor-body media-editor-body-full' },
			renderCanvas(),
			renderSidebar()
		)
	);
}

// Main App Component
function MediaEditorApp() {
	const [ postId, setPostId ] = useState( () => {
		// Check URL parameters first, then fall back to default
		const urlParams = new URLSearchParams( window.location.search );
		return urlParams.get( 'post_id' ) || jetpackCustomPage.postId || '27';
	} );
	const [ error, setError ] = useState( null );

	useEffect( () => {
		// Update postId if the setting changes
		const settingInput = document.getElementById( 'custom_setting' );
		if ( settingInput ) {
			// Set initial value from current postId
			settingInput.value = postId;

			const handleChange = () => {
				const newPostId = settingInput.value.trim();
				if ( newPostId && newPostId !== postId && /^\d+$/.test( newPostId ) ) {
					setPostId( newPostId );
					// Update URL parameter
					const url = new URL( window.location );
					url.searchParams.set( 'post_id', newPostId );
					window.history.replaceState( {}, '', url );
				}
			};

			const handleInput = () => {
				const newPostId = settingInput.value.trim();
				if ( newPostId && newPostId !== postId && /^\d+$/.test( newPostId ) ) {
					setPostId( newPostId );
					// Update URL parameter
					const url = new URL( window.location );
					url.searchParams.set( 'post_id', newPostId );
					window.history.replaceState( {}, '', url );
				}
			};

			// Listen to both input and change events for real-time updates
			settingInput.addEventListener( 'input', handleInput );
			settingInput.addEventListener( 'change', handleChange );

			return () => {
				settingInput.removeEventListener( 'input', handleInput );
				settingInput.removeEventListener( 'change', handleChange );
			};
		}
	}, [ postId ] );

	if ( error ) {
		return createElement( Notice, { status: 'error', isDismissible: false }, error );
	}

	return createElement(
		'div',
		{ className: 'jetpack-media-editor-app' },
		createElement( FullscreenMediaEditor, {
			postType: 'attachment',
			postId: postId,
			setPostId: setPostId,
			isPreview: false,
		} )
	);
}

// Initialize the app when DOM is ready
document.addEventListener( 'DOMContentLoaded', function () {
	const container = document.getElementById( 'jetpack-media-editor-container' );

	if ( container ) {
		// Remove loading placeholder
		container.innerHTML = '';

		// Render the React app
		render( createElement( MediaEditorApp ), container );
	}
} );

// Also try to initialize immediately in case DOMContentLoaded already fired
( function () {
	const container = document.getElementById( 'jetpack-media-editor-container' );

	if ( container && document.readyState === 'complete' ) {
		container.innerHTML = '';
		render( createElement( MediaEditorApp ), container );
	}
} )();

// Add some custom styles
const style = document.createElement( 'style' );
style.textContent = `
	.media-editor-container {
		padding: 20px;
		border: 1px solid #ddd;
		border-radius: 4px;
		background: #fff;
	}

	.media-editor-loading {
		display: flex;
		align-items: center;
		gap: 10px;
		padding: 20px;
		text-align: center;
		justify-content: center;
	}

	.media-info {
		margin: 10px 0;
		font-size: 14px;
	}

	.media-preview {
		border-top: 1px solid #eee;
		padding-top: 15px;
	}

	.jetpack-media-editor-app {
		min-height: 200px;
	}

	.media-editor-no-data {
		padding: 40px;
		text-align: center;
		color: #666;
		background: #f9f9f9;
		border-radius: 4px;
	}
`;
document.head.appendChild( style );
