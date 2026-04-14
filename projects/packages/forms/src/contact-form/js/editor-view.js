/* global grunionEditorView, tinyMCE, QTags */

( function ( $, wp, grunionEditorView ) {
	wp.mce = wp.mce || {};
	if ( 'undefined' === typeof wp.mce.views ) {
		return;
	}

	function buildRefShortcode( refId ) {
		return '[contact-form ref="' + refId + '"]';
	}

	function appendBareParam( url ) {
		return url + ( url.indexOf( '?' ) > -1 ? '&' : '?' ) + 'bare=1';
	}

	function grunionGet( url ) {
		return $.ajax( {
			url: url,
			method: 'GET',
			beforeSend: function ( xhr ) {
				xhr.setRequestHeader( 'X-WP-Nonce', grunionEditorView.rest_nonce );
			},
		} );
	}

	wp.mce.grunion_wp_view_renderer = {
		shortcode_string: 'contact-form',
		template: wp.template( 'grunion-contact-form' ),
		field_templates: {
			email: wp.template( 'grunion-field-email' ),
			telephone: wp.template( 'grunion-field-telephone' ),
			textarea: wp.template( 'grunion-field-textarea' ),
			radio: wp.template( 'grunion-field-radio' ),
			checkbox: wp.template( 'grunion-field-checkbox' ),
			'checkbox-multiple': wp.template( 'grunion-field-checkbox-multiple' ),
			select: wp.template( 'grunion-field-select' ),
			date: wp.template( 'grunion-field-date' ),
			text: wp.template( 'grunion-field-text' ),
			name: wp.template( 'grunion-field-text' ),
			url: wp.template( 'grunion-field-url' ),
		},
		edit_template: wp.template( 'grunion-field-edit' ),
		editor_inline: wp.template( 'grunion-editor-inline' ),
		editor_option: wp.template( 'grunion-field-edit-option' ),
		ref_preview_promises: {},
		fetchRefPreviewUrl: function ( refId ) {
			if ( this.ref_preview_promises[ refId ] ) {
				return this.ref_preview_promises[ refId ];
			}
			const url = grunionEditorView.rest_url + '/' + encodeURIComponent( refId ) + '/preview-url';
			const deferred = $.Deferred();
			grunionGet( url )
				.done( function ( response ) {
					if ( response && response.preview_url ) {
						deferred.resolve( appendBareParam( response.preview_url ) );
					} else {
						deferred.reject();
					}
				} )
				.fail( function () {
					deferred.reject();
				} );
			this.ref_preview_promises[ refId ] = deferred.promise();
			return this.ref_preview_promises[ refId ];
		},
		resizeRefIframe: function ( iframe ) {
			try {
				const doc = iframe.contentDocument || iframe.contentWindow.document;
				if ( ! doc || ! doc.body ) {
					return;
				}
				const height = Math.max(
					doc.body.scrollHeight,
					doc.documentElement ? doc.documentElement.scrollHeight : 0
				);
				if ( height <= 0 ) {
					return;
				}
				const target = height + 10;
				// Skip no-op writes so we don't trigger needless reflow each tick.
				if ( iframe._grunionAppliedHeight === target ) {
					return;
				}
				iframe._grunionAppliedHeight = target;
				iframe.style.height = target + 'px';
			} catch {
				/* cross-origin fallback — leave default height */
			}
		},
		hydrateRefPreviews: function () {
			const self = this;
			if ( ! window.tinyMCE || ! tinyMCE.activeEditor ) {
				return;
			}
			const doc = tinyMCE.activeEditor.getDoc();
			if ( ! doc ) {
				return;
			}
			const wraps = doc.querySelectorAll(
				'.jetpack-contact-form-ref-preview[data-form-ref]:not([data-grunion-loaded])'
			);
			wraps.forEach( function ( wrap ) {
				const refId = parseInt( wrap.getAttribute( 'data-form-ref' ), 10 );
				if ( ! refId ) {
					return;
				}
				wrap.setAttribute( 'data-grunion-loaded', '1' );
				self
					.fetchRefPreviewUrl( refId )
					.done( function ( previewUrl ) {
						const iframe = wrap.querySelector( 'iframe.grunion-ref-preview-iframe' );
						if ( ! iframe ) {
							return;
						}
						iframe.addEventListener( 'load', function () {
							self.resizeRefIframe( iframe );
							// Re-measure after late-loading images/scripts settle.
							setTimeout( function () {
								self.resizeRefIframe( iframe );
							}, 300 );
							setTimeout( function () {
								self.resizeRefIframe( iframe );
							}, 1000 );
							const hint = wrap.querySelector( '.grunion-ref-preview-hint' );
							if ( hint ) {
								hint.style.display = 'none';
							}
							wrap.classList.add( 'is-loaded' );
						} );
						iframe.setAttribute( 'src', previewUrl );
					} )
					.fail( function () {
						wrap.removeAttribute( 'data-grunion-loaded' );
						const hint = wrap.querySelector( '.grunion-ref-preview-hint' );
						if ( hint ) {
							hint.textContent = grunionEditorView.labels.ref_preview_error;
						}
					} );
			} );
		},
		getRefContent: function ( refId ) {
			const self = this;
			// Hydrate once the view is mounted in TinyMCE.
			setTimeout( function () {
				self.hydrateRefPreviews();
			}, 50 );
			return (
				'<div class="jetpack-contact-form-ref-preview" data-form-ref="' +
				refId +
				'">' +
				'<p class="grunion-ref-preview-hint">' +
				grunionEditorView.labels.ref_preview_loading +
				'</p>' +
				// width="100%" as an HTML attribute so the iframe stretches even
				// if no CSS reaches it. Browsers map this to width:100%.
				'<iframe class="grunion-ref-preview-iframe" scrolling="no" width="100%" frameborder="0" title="' +
				grunionEditorView.labels.ref_preview_title +
				'"></iframe>' +
				'</div>'
			);
		},
		getContent: function () {
			const namedAttrs = ( this.shortcode.attrs && this.shortcode.attrs.named ) || {};
			const refId = parseInt( namedAttrs.ref, 10 );
			if ( refId > 0 ) {
				return this.getRefContent( refId );
			}

			let content = this.shortcode.content,
				index = 0,
				field,
				named,
				body = '';

			// If it's the legacy `[contact-form /]` syntax, populate default fields.
			if ( ! content ) {
				content = grunionEditorView.default_form;
			}

			// Render the fields.
			while ( ( field = wp.shortcode.next( 'contact-field', content, index ) ) ) {
				index = field.index + field.content.length;
				named = field.shortcode.attrs.named;
				if ( ! named.type || ! this.field_templates[ named.type ] ) {
					named.type = 'text';
				}
				if ( named.required ) {
					named.required = grunionEditorView.labels.required_field_text;
				}
				if ( named.options && 'string' === typeof named.options ) {
					named.options = named.options.split( ',' );
				}
				body += this.field_templates[ named.type ]( named );
			}

			const options = {
				body: body,
				submit_button_text: grunionEditorView.labels.submit_button_text,
			};

			return this.template( options );
		},
		edit: function ( data, update_callback ) {
			const shortcode_data = wp.shortcode.next( this.shortcode_string, data );
			const shortcode = shortcode_data.shortcode;

			// Synced forms (ref attribute) are managed in the form editor, not inline.
			const refId = parseInt(
				( shortcode.attrs && shortcode.attrs.named && shortcode.attrs.named.ref ) || '',
				10
			);
			if ( refId > 0 ) {
				// Restore the original shortcode so the view doesn't get stuck in edit mode.
				update_callback( wp.shortcode.string( shortcode ) );
				const template = grunionEditorView.edit_form_url_template || '';
				if ( template ) {
					const url = template.replace( '%d', String( refId ) );
					window.open( url, '_blank', 'noopener' );
				}
				return;
			}

			const $tinyMCE_document = $( tinyMCE.activeEditor.getDoc() );
			const $view = $tinyMCE_document.find( '.wpview.wpview-wrap' ).filter( function () {
				return $( this ).attr( 'data-mce-selected' );
			} );
			const $editframe = $( '<iframe scrolling="no" class="inline-edit-contact-form" />' );
			let index = 0;
			let named;
			let fields = '';
			let field;

			if ( ! shortcode.content ) {
				shortcode.content = grunionEditorView.default_form;
			}

			// Render the fields.
			while ( ( field = wp.shortcode.next( 'contact-field', shortcode.content, index ) ) ) {
				index = field.index + field.content.length;
				named = field.shortcode.attrs.named;
				if ( named.options && 'string' === typeof named.options ) {
					named.options = named.options.split( ',' );
				}
				fields += this.edit_template( named );
			}

			$editframe.on( 'checkheight', function () {
				const innerDoc = this.contentDocument ? this.contentDocument : this.contentWindow.document;
				this.style.height = '10px';
				this.style.height = 5 + innerDoc.body.scrollHeight + 'px';
				tinyMCE.activeEditor.execCommand( 'wpAutoResize' );
			} );

			$editframe.on( 'load', function () {
				const stylesheet_url =
						1 === window.isRtl
							? grunionEditorView.inline_editing_style_rtl
							: grunionEditorView.inline_editing_style,
					$stylesheet = $( '<link rel="stylesheet" href="' + stylesheet_url + '" />' ),
					$dashicons_css = $(
						'<link rel="stylesheet" href="' + grunionEditorView.dashicons_css_url + '" />'
					);

				$stylesheet.on( 'load', function () {
					$editframe.contents().find( 'body' ).css( 'visibility', 'visible' );
					$editframe.trigger( 'checkheight' );
				} );
				$editframe.contents().find( 'head' ).append( $stylesheet ).append( $dashicons_css );

				$editframe
					.contents()
					.find( 'body' )
					.html(
						wp.mce.grunion_wp_view_renderer.editor_inline( {
							to: shortcode.attrs.named.to,
							subject: shortcode.attrs.named.subject,
							fields: fields,
						} )
					)
					.css( 'visibility', 'hidden' );

				$editframe.contents().find( 'input:first' ).focus();

				setTimeout( function () {
					$editframe.trigger( 'checkheight' );
				}, 250 );

				// Add a second timeout for super long forms racing, and to not slow it down for shorter forms unnecessarily.
				setTimeout( function () {
					$editframe.trigger( 'checkheight' );
				}, 500 );

				const $editfields = $editframe.contents().find( '.grunion-fields' ),
					$buttons = $editframe.contents().find( '.grunion-controls' );

				$editfields.sortable();

				// Now, add all the listeners!

				$editfields.on( 'change select', 'select[name=type]', function () {
					$( this ).closest( '.grunion-field-edit' )[ 0 ].className =
						'card is-compact grunion-field-edit grunion-field-' + $( this ).val();
					$editframe.trigger( 'checkheight' );
				} );

				$editfields.on( 'click', '.delete-option', function ( e ) {
					e.preventDefault();
					$( this ).closest( 'li' ).remove();
					$editframe.trigger( 'checkheight' );
				} );

				$editfields.on( 'click', '.add-option', function ( e ) {
					const $new_option = $( wp.mce.grunion_wp_view_renderer.editor_option() );
					e.preventDefault();
					$( this ).closest( 'li' ).before( $new_option );
					$editframe.trigger( 'checkheight' );
					$new_option.find( 'input:first' ).focus();
				} );

				$editfields.on( 'click', '.delete-field', function ( e ) {
					e.preventDefault();
					$( this ).closest( '.card' ).remove();
					$editframe.trigger( 'checkheight' );
				} );

				$buttons.find( 'input[name=submit]' ).on( 'click', function () {
					const new_data = shortcode;

					new_data.type = 'closed';
					new_data.attrs = {};
					new_data.content = '';

					$editfields.children().each( function () {
						const field_shortcode = {
								tag: 'contact-field',
								type: 'single',
								attrs: {
									label: $( this ).find( 'input[name=label]' ).val(),
									type: $( this ).find( 'select[name=type]' ).val(),
								},
							},
							options = [];

						if ( $( this ).find( 'input[name=required]:checked' ).length ) {
							field_shortcode.attrs.required = '1';
						}

						$( this )
							.find( 'input[name=option]' )
							.each( function () {
								if ( $( this ).val() ) {
									options.push( $( this ).val() );
								}
							} );
						if ( options.length ) {
							field_shortcode.attrs.options = options.join( ',' );
						}

						new_data.content += wp.shortcode.string( field_shortcode );
					} );

					if ( $editframe.contents().find( 'input[name=to]' ).val() ) {
						new_data.attrs.to = $editframe.contents().find( 'input[name=to]' ).val();
					}
					if ( $editframe.contents().find( 'input[name=subject]' ).val() ) {
						new_data.attrs.subject = $editframe.contents().find( 'input[name=subject]' ).val();
					}

					update_callback( wp.shortcode.string( new_data ) );
				} );

				$buttons.find( 'input[name=cancel]' ).on( 'click', function () {
					update_callback( wp.shortcode.string( shortcode ) );
				} );

				$buttons.find( 'input[name=add-field]' ).on( 'click', function () {
					const $new_field = $( wp.mce.grunion_wp_view_renderer.edit_template( {} ) );
					$editfields.append( $new_field );
					$editfields.sortable( 'refresh' );
					$editframe.trigger( 'checkheight' );
					$new_field.find( 'input:first' ).focus();
				} );
			} );

			$view.html( $editframe );
		},
	};
	wp.mce.views.register( 'contact-form', wp.mce.grunion_wp_view_renderer );

	const FormPickerModal = ( function () {
		const labels = grunionEditorView.labels;
		const modalTemplate = wp.template( 'grunion-form-picker-modal' );
		const emptyTemplate = wp.template( 'grunion-form-picker-empty' );

		let $overlay = null;
		let $dialog = null;
		let $select = null;
		let $previewFrame = null;
		let $insertBtn = null;
		let invokingElement = null;
		let pendingEditor = null;
		let previewRequest = 0;

		function getActiveEditor() {
			if ( pendingEditor ) {
				return pendingEditor;
			}
			const $wrap = $( '#wp-content-wrap' );
			if ( $wrap.hasClass( 'tmce-active' ) && window.tinyMCE && tinyMCE.activeEditor ) {
				return tinyMCE.activeEditor;
			}
			return null;
		}

		function insertShortcode( shortcode ) {
			const editor = getActiveEditor();
			if ( editor && ! editor.isHidden() ) {
				editor.execCommand( 'mceInsertContent', 0, shortcode );
				return true;
			}
			if ( window.QTags && $( '#wp-content-wrap' ).hasClass( 'html-active' ) ) {
				QTags.insertContent( shortcode );
				return true;
			}
			if ( window.tinyMCE && tinyMCE.activeEditor ) {
				tinyMCE.activeEditor.execCommand( 'mceInsertContent', 0, shortcode );
				return true;
			}
			window.console.error( 'Neither TinyMCE nor QuickTags is active. Unable to insert form.' );
			return false;
		}

		function renderEmptyState() {
			const $body = $dialog.find( '.grunion-form-picker-body' );
			$body.html(
				emptyTemplate( {
					labels: labels,
					new_form_url: grunionEditorView.new_form_url,
				} )
			);
			$dialog.find( '.grunion-form-picker-insert' ).prop( 'disabled', true ).hide();
		}

		function fetchForms() {
			return grunionGet(
				grunionEditorView.rest_url +
					'?per_page=100&status=publish&orderby=modified&order=desc&_fields=id,title,modified,status'
			);
		}

		function fetchPreviewUrl( formId ) {
			return grunionGet(
				grunionEditorView.rest_url + '/' + encodeURIComponent( formId ) + '/preview-url'
			);
		}

		function populateSelect( forms ) {
			$select.empty().prop( 'disabled', false );
			$select.append(
				$( '<option />', {
					value: '',
					text: labels.picker_placeholder,
				} )
			);

			forms.forEach( function ( form ) {
				const title =
					( form.title && form.title.rendered && form.title.rendered.trim() ) ||
					labels.picker_untitled;
				$select.append(
					$( '<option />', {
						value: form.id,
						text: title,
					} )
				);
			} );
		}

		function showPreviewMessage( message ) {
			$previewFrame.html(
				$( '<p />', {
					class: 'grunion-form-picker-preview-hint',
					text: message,
				} )
			);
		}

		function loadPreview( formId ) {
			previewRequest++;
			const requestId = previewRequest;

			showPreviewMessage( labels.picker_loading );

			fetchPreviewUrl( formId )
				.done( function ( response ) {
					if ( requestId !== previewRequest || ! $previewFrame ) {
						return;
					}
					if ( ! response || ! response.preview_url ) {
						showPreviewMessage( labels.picker_preview_err );
						return;
					}
					const $iframe = $( '<iframe />', {
						src: appendBareParam( response.preview_url ),
						class: 'grunion-form-picker-preview-iframe',
						title: labels.picker_preview,
					} );
					$previewFrame.empty().append( $iframe );
				} )
				.fail( function () {
					if ( requestId !== previewRequest || ! $previewFrame ) {
						return;
					}
					showPreviewMessage( labels.picker_preview_err );
				} );
		}

		function onChange() {
			const formId = parseInt( $select.val(), 10 );
			if ( ! formId ) {
				$insertBtn.prop( 'disabled', true );
				showPreviewMessage( labels.picker_preview_hint );
				return;
			}
			$insertBtn.prop( 'disabled', false );
			loadPreview( formId );
		}

		function onInsert() {
			const formId = parseInt( $select.val(), 10 );
			if ( ! formId ) {
				return;
			}
			if ( insertShortcode( buildRefShortcode( formId ) ) ) {
				close();
			}
		}

		function onKeydown( e ) {
			if ( e.key === 'Escape' || e.keyCode === 27 ) {
				e.preventDefault();
				close();
			}
		}

		function close() {
			if ( ! $overlay ) {
				return;
			}
			$( document ).off( 'keydown.grunionFormPicker' );
			$overlay.remove();
			$overlay = null;
			$dialog = null;
			$select = null;
			$previewFrame = null;
			$insertBtn = null;
			pendingEditor = null;
			previewRequest = 0;
			if ( invokingElement && typeof invokingElement.focus === 'function' ) {
				try {
					invokingElement.focus();
				} catch {
					/* no-op */
				}
			}
			invokingElement = null;
		}

		function open( opts ) {
			if ( $overlay ) {
				return;
			}
			opts = opts || {};
			invokingElement = opts.invokingElement || document.activeElement;
			pendingEditor = opts.editor || null;

			$overlay = $(
				modalTemplate( {
					labels: labels,
					new_form_url: grunionEditorView.new_form_url,
				} )
			);
			$dialog = $overlay.find( '.grunion-form-picker-dialog' );
			$select = $overlay.find( '.grunion-form-picker-select' );
			$previewFrame = $overlay.find( '.grunion-form-picker-preview-frame' );
			$insertBtn = $overlay.find( '.grunion-form-picker-insert' );

			$( 'body' ).append( $overlay );

			$overlay.on( 'click', function ( e ) {
				if ( e.target === $overlay[ 0 ] ) {
					close();
				}
			} );
			$overlay
				.find( '.grunion-form-picker-close, .grunion-form-picker-cancel' )
				.on( 'click', close );
			$overlay.on( 'change', '.grunion-form-picker-select', onChange );
			$overlay.on( 'click', '.grunion-form-picker-insert', onInsert );
			$( document ).on( 'keydown.grunionFormPicker', onKeydown );

			setTimeout( function () {
				const $focusTarget = $dialog.find( '.grunion-form-picker-close' );
				if ( $focusTarget.length ) {
					$focusTarget.trigger( 'focus' );
				}
			}, 0 );

			fetchForms()
				.done( function ( forms ) {
					if ( ! $overlay ) {
						return;
					}
					if ( ! Array.isArray( forms ) || forms.length === 0 ) {
						renderEmptyState();
						return;
					}
					populateSelect( forms );
				} )
				.fail( function () {
					if ( ! $overlay ) {
						return;
					}
					$select.empty().prop( 'disabled', true );
					$select.append( $( '<option />', { text: labels.picker_load_error } ) );
				} );
		}

		return { open: open, close: close };
	} )();

	QTags.addButton( 'grunion_shortcode', grunionEditorView.labels.quicktags_label, function () {
		FormPickerModal.open( { invokingElement: document.activeElement } );
	} );

	$( document ).on( 'click', '#insert-jetpack-contact-form', function ( e ) {
		e.preventDefault();
		FormPickerModal.open( { invokingElement: this } );
	} );

	// TinyMCE toolbar button dispatches this event via its mce command.
	$( document ).on( 'grunion:openFormPicker', function ( e, payload ) {
		payload = payload || {};
		FormPickerModal.open( {
			editor: payload.editor || null,
			invokingElement: document.activeElement,
		} );
	} );
} )( jQuery, wp, grunionEditorView );
