/* global wordadsEditorView, tinymce */
( function() {
	tinymce.create( 'tinymce.plugins.wordads', {

		init: function( editor ) {
			editor.addButton( 'grunion', {
				title: wordadsEditorView.labels.tinymce_label,
				cmd: 'wordads_add_inline_ad',
				icon: 'grunion'
			} );
			editor.addCommand( 'wordads_add_inline_ad', function() {
				editor.execCommand( 'mceInsertContent', 0, '[wordad]' );
			} );
		},

		createControl: function() {
			return null;
		},

		getInfo: function() {
			return {
				longname: 'WordAds Inline Ad',
				author: 'Automattic',
				version: '1'
			};
		}
	} );

	tinymce.PluginManager.add( 'wordads', tinymce.plugins.wordads );
} )();
