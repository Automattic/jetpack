/*
 * https://jetpackcrm.com
 *
 * MailPoet List view JS
 */

/**
 * @param dataLine
 */
function jpcrm_list_view_segment_action_export_button( dataLine ) {
	var url = zeroBSCRMJS_listView_editURL( dataLine.id );
	var label = zeroBSCRMJS_listViewLang( 'mailpoet_export', 'MailPoet Export' );

	return `
        <a href="${ url }&mailpoet_export=1" class="ui basic tiny button">
            <i class="icon mail forward"></i> ${ label }
        </a>
    `;
}

if ( typeof module !== 'undefined' ) {
    module.exports = { jpcrm_list_view_segment_action_export_button };
}