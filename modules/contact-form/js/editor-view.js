/* global grunionEditorView, tinyMCE, QTags */
(function( $, wp, grunionEditorView ){
	wp.mce = wp.mce || {};
	if ( 'undefined' === typeof wp.mce.views ) {
		return;
	}

	wp.mce.grunion_wp_view_renderer = {
		shortcode_string : 'contact-form',
		template       : wp.template( 'grunion-contact-form' ),
		field_templates: {
			email               : wp.template( 'grunion-field-email' ),
			telephone           : wp.template( 'grunion-field-telephone' ),
			textarea            : wp.template( 'grunion-field-textarea' ),
			radio               : wp.template( 'grunion-field-radio' ),
			checkbox            : wp.template( 'grunion-field-checkbox' ),
			"checkbox-multiple" : wp.template( 'grunion-field-checkbox-multiple' ),
			select              : wp.template( 'grunion-field-select' ),
			date                : wp.template( 'grunion-field-date' ),
			text                : wp.template( 'grunion-field-text' )
		},
		edit_template  : wp.template( 'grunion-field-edit' ),
		editor_inline  : wp.template( 'grunion-editor-inline' ),
		editor_option  : wp.template( 'grunion-field-edit-option' ),
		getContent     : function() {
			var content = this.shortcode.content,
				index = 0,
				field, named,
				body = '';

			// If it's the legacy `[contact-form /]` syntax, populate default fields.
			if ( ! content ) {
				content = grunionEditorView.default_form;
			}

			// Render the fields.
			while ( field = wp.shortcode.next( 'contact-field', content, index ) ) {
				index = field.index + field.content.length;
				named = field.shortcode.attrs.named;
				if ( ! named.type || ! this.field_templates[ named.type ] ) {
					named.type = 'text';
				}
				if ( named.required ) {
					named.required = grunionEditorView.labels.required_field_text;
				}
				if ( named.options && 'string' === typeof named.options ) {
					named.options = named.options.split(',');
				}
				body += this.field_templates[ named.type ]( named );
			}

			options = {
				body : body,
				submit_button_text : grunionEditorView.labels.submit_button_text
			};

			return this.template( options );
		},
		edit: function( data, update_callback ) {
			var shortcode_data = wp.shortcode.next( this.shortcode_string, data ),
				shortcode = shortcode_data.shortcode,
				$tinyMCE_document = $( tinyMCE.activeEditor.getDoc() ),
				$view = $tinyMCE_document.find('.wpview.wpview-wrap').filter(function(){
					return $(this).attr('data-mce-selected');
				}),
				$editframe = $('<iframe scrolling="no" class="inline-edit-contact-form" />'),
				index = 0,
				named,
				fields = '',
				$stylesheet = $( '<link rel="stylesheet" href="' + grunionEditorView.inline_editing_style + '" />' ),
				$dashicons_css  = $( '<link rel="stylesheet" href="' + grunionEditorView.dashicons_css_url + '" />' ),
				$editfields;

			if ( ! shortcode.content ) {
				shortcode.content = grunionEditorView.default_form;
			}

			// Render the fields.
			while ( field = wp.shortcode.next( 'contact-field', shortcode.content, index ) ) {
				index = field.index + field.content.length;
				named = field.shortcode.attrs.named;
				if ( named.options && 'string' === typeof named.options ) {
					named.options = named.options.split(',');
				}
				fields += this.edit_template( named );
			}

			$view.html( $editframe );

			$editframe.contents().find('head').append( $stylesheet ).append( $dashicons_css );
			$stylesheet.on( 'load', function(){
				$editframe.trigger('checkheight');
			});

			$editframe.contents().find('body').html( this.editor_inline( {
				to      : shortcode.attrs.named.to,
				subject : shortcode.attrs.named.subject,
				fields  : fields
			}) );

			$editframe.on('checkheight', function(){
				this.style.height = '10px';
				this.style.height = ( 5 + this.contentWindow.document.body.scrollHeight ) + 'px';
				tinyMCE.activeEditor.execCommand('wpAutoResize');
			}).trigger('checkheight').hide().fadeIn(250, function(){
				$(this).contents().find('input:first').focus();
			});

			$editfields = $editframe.contents().find('.grunion-fields');
			$editfields.sortable();
			$editfields.on( 'change select', 'select[name=type]', function(){
				$(this).closest('.grunion-field-edit')[0].className = 'card is-compact grunion-field-edit grunion-field-' + $(this).val();
				$editframe.trigger('checkheight');
			});

			var $buttons = $editframe.contents().find('.buttons');

			// The 'save' listener.
			$buttons.find('input[name=submit]').on( 'click', function(){
				var new_data = shortcode;

				new_data.type = 'closed';
				new_data.attrs = {};
				new_data.content = '';

				$editfields.children().each( function(){
					var field_shortcode = {
							tag   : 'contact-field',
							type  : 'single',
							attrs : {
								label : $(this).find('input[name=label]').val(),
								type  : $(this).find('select[name=type]').val(),
							}
						},
						options = [];

					if ( $(this).find('input[name=required]:checked').length ) {
						field_shortcode.attrs.required = '1';
					}

					$(this).find('input[name=option]').each( function(){
						if ( $(this).val() ) {
							options.push( $(this).val() );
						}
					});
					if ( options.length ) {
						field_shortcode.attrs.options = options.join(',');
					}

					new_data.content += wp.shortcode.string( field_shortcode );
				} );

				if ( $editframe.contents().find('input[name=to]').val() ) {
					new_data.attrs.to = $editframe.contents().find('input[name=to]').val();
				}
				if ( $editframe.contents().find('input[name=subject]').val() ) {
					new_data.attrs.subject = $editframe.contents().find('input[name=subject]').val();
				}

				update_callback( wp.shortcode.string( new_data ) );
			});

			$buttons.find('input[name=cancel]').on( 'click', function(){
				update_callback( wp.shortcode.string( shortcode ) );
			});

			$buttons.find('input[name=add-field]').on( 'click', function(){
				var $new_field = $( wp.mce.grunion_wp_view_renderer.edit_template({}) );
				$editfields.append( $new_field );
				$editfields.sortable('refresh');
				$editframe.trigger('checkheight');
				$new_field.find('input:first').focus();
			});

			$editfields.on( 'click', '.delete-option', function(e){
				e.preventDefault();
				$(this).closest('li').remove();
				$editframe.trigger('checkheight');
			});

			$editfields.on( 'click', '.add-option', function(e){
				var $new_option = $( wp.mce.grunion_wp_view_renderer.editor_option() );
				e.preventDefault();
				$(this).closest('li').before( $new_option );
				$editframe.trigger('checkheight');
				$new_option.find('input:first').focus();
			});

			$editfields.on( 'click', '.delete-field', function(e){
				e.preventDefault();
				$(this).closest('.card').remove();
				$editframe.trigger('checkheight');
			});
		}
	};
	wp.mce.views.register( 'contact-form', wp.mce.grunion_wp_view_renderer );

	// Add the 'text' editor button.
	QTags.addButton(
		'grunion_shortcode',
		grunionEditorView.labels.quicktags_label,
		function(){
			QTags.insertContent( '[contact-form]' + grunionEditorView.default_form + '[/contact-form]' );
		}
	);

}( jQuery, wp, grunionEditorView ));
