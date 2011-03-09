edButtons[edButtons.length] = new edButton('ed_AtD', 'AtD', '', '', '');

/* convienence method to restore the text area from the preview div */
function AtD_restore_text_area()
{
	/* clear the error HTML out of the preview div */
	AtD.remove('content'); 

	/* swap the preview div for the textarea, notice how I have to restore the appropriate class/id/style attributes */

        var content;

	if (navigator.appName == 'Microsoft Internet Explorer')
		content = jQuery('#content').html().replace(/<BR.*?class.*?atd_remove_me.*?>/gi, "\n");
	else
		content = jQuery('#content').html();

	jQuery('#content').replaceWith( AtD.content_canvas );
	jQuery('#content').val( content.replace(/\&lt\;/g, '<').replace(/\&gt\;/g, '>').replace(/\&amp;/g, '&') );
	jQuery('#content').height(AtD.height); 

	/* change the link text back to its original label */
	jQuery('#ed_AtD').val( AtD.getLang('button_proofread', 'proofread') );
	jQuery('#ed_AtD').css({ 'color' : '#464646' });

	/* enable the toolbar buttons */
	for (var z = 0; z < edButtons.length; z++)
		if ( edButtons[z].id != 'ed_AtD' )
			jQuery( '#' + edButtons[z].id ).attr('disabled', false);

	jQuery( '#ed_spell' ).attr( 'disabled', false );
	jQuery( '#ed_close' ).attr( 'disabled', false );

	/* restore autosave */
	if (AtD.autosave != undefined)
		autosave = AtD.autosave;
};

/* javascript does some lazy evaluation of function names, have to do the function swap
   this way to make it work as expected */
function AtD_replace_show_function( foo ) {
	var old_button = foo;
	edShowButton = function(button, i) {
		if (button.id == 'ed_AtD') {
			document.write('<input type="button" id="' + button.id + '" accesskey="' + button.access + '" class="ed_button" onclick="AtD_check();" value="' + AtD_l10n_r0ar.button_proofread + '" />');
		} else {
			old_button(button, i);
		}
	}
}

AtD_replace_show_function( edShowButton );

function AtD_restore_if_proofreading() {
	if (jQuery('#ed_AtD').val() == AtD.getLang('button_edit_text', 'edit text')) 
		AtD_restore_text_area();
}

function AtD_unbind_proofreader_listeners() {
	jQuery('#save-post, #post-preview, #publish, #edButtonPreview').unbind('focus', AtD_restore_if_proofreading );
	jQuery('#add_poll, #add_image, #add_video, #add_audio, #add_media').unbind('click', AtD_restore_if_proofreading );
	jQuery('#post').unbind('submit', AtD_restore_if_proofreading );
}

function AtD_bind_proofreader_listeners() {
	jQuery('#save-post, #post-preview, #publish, #edButtonPreview').focus( AtD_restore_if_proofreading );
	jQuery('#add_poll, #add_image, #add_video, #add_audio, #add_media').click( AtD_restore_if_proofreading );
	jQuery('#post').submit( AtD_restore_if_proofreading );
}

/* where the magic happens, checks the spelling or restores the form */
function AtD_check(callback) {

	/* If the text of the link says edit comment, then restore the textarea so the user can edit the text */
	if (jQuery('#ed_AtD').val() == AtD.getLang('button_edit_text', 'edit text')) {                               
		AtD_restore_text_area(); 
	} else {
		/* initialize some of the stuff related to this plugin */
		if (AtD.height == undefined) {

			AtD.height = jQuery('#content').height();
			AtD_bind_proofreader_listeners();

			/* make it so clicking the Visual button works when AtD is active */

			jQuery('#edButtonPreview').attr( 'onclick', null ).click( function() {
				AtD_restore_if_proofreading();
				switchEditors.go( 'content', 'tinymce' );
			});

			/* saved the textarea as we need to restore the original one for the toolbar to continue to function properly */
			AtD.content_canvas = jQuery('#content');

			/* store the autosave, we're going to make it empty during spellcheck to prevent auto saved text from being
			   over written with empty text */
			AtD.autosave = autosave;
		}

		/* set the spell check link to a link that lets the user edit the text */
		jQuery('#ed_AtD').val(AtD.getLang('button_edit_text', 'edit text'));
		jQuery('#ed_AtD').css({ 'color' : 'red' });

		/* disable the button to prevent a race condition where content is deleted if proofread is clicked with a check
		   in progress. */
		jQuery('#ed_AtD').attr('disabled', true); 

		/* replace the div */
		var text = jQuery('#content').val().replace(/\&/g, '&amp;').replace(/\</g, '&lt;').replace(/\>/g, '&gt;');

		if (navigator.appName == 'Microsoft Internet Explorer') {
			text = text.replace(/[\n\r\f]/gm, '<BR class="atd_remove_me">');
			var node = jQuery('<div class="input" id="content" style="height: 170px">' + text + '</div>');
			jQuery('#content').replaceWith(node);
			node.css( { 'overflow' : 'auto', 'background-color' : 'white', 'color' : 'black' } );
		} else {
			jQuery('#content').replaceWith('<div class="input" id="content">' + text + '</div>');
			jQuery('#content').css( { 'overflow' : 'auto', 'background-color' : 'white', 'color' : 'black', 'white-space' : 'pre-wrap' } );
			jQuery('#content').height(AtD.height); 
		}

		/* kill autosave... :) */
		autosave = function() { };

		/* disable the toolbar buttons */
		for (var z = 0; z < edButtons.length; z++)
			if ( edButtons[z].id != 'ed_AtD' )
				jQuery( '#' + edButtons[z].id ).attr( 'disabled', true );

		jQuery( '#ed_spell' ).attr( 'disabled', true );
		jQuery( '#ed_close' ).attr( 'disabled', true );

		/* check the writing in the textarea */
		AtD.check('content', {
			success: function(errorCount) {
				if (errorCount == 0 && typeof callback === 'undefined')
					alert( AtD.getLang('message_no_errors_found', 'No writing errors were found') );
				AtD_restore_if_proofreading();
			},

			ready: function(errorCount) {
				jQuery('#ed_AtD').attr('disabled', false);

				if( typeof callback !== 'undefined') 
					callback( errorCount );
			},

			error: function(reason) {
				jQuery('#ed_AtD').attr('disabled', false);

				if( typeof callback !== 'undefined') 
					callback( -1 );
				else 
					alert( AtD.getLang('message_server_error', 'There was a problem communicating with the After the Deadline service. Try again in one minute.') );

				AtD_restore_if_proofreading();
			},

			editSelection: function(element) {
				var text = prompt( AtD.getLang('dialog_replace_selection', 'Replace selection with:'), element.text() );

				if (text != null)
					element.replaceWith( text );
			}, 

			explain: function(url) {
				var left = (screen.width / 2) - (480 / 2);
				var top = (screen.height / 2) - (380 / 2);
				window.open( url, '', 'width=480,height=380,toolbar=0,status=0,resizable=0,location=0,menuBar=0,left=' + left + ',top=' + top).focus();
			},

			ignore: function(word) {
				jQuery.ajax({
					type : 'GET',
					url : AtD.rpc_ignore + encodeURI( word ).replace( /&/g, '%26'),
					format : 'raw',
					error : function(XHR, status, error) {
						if (AtD.callback_f != undefined && AtD.callback_f.error != undefined)
							AtD.callback_f.error(status + ": " + error);
					}
				});
			}
		});
	}
}
