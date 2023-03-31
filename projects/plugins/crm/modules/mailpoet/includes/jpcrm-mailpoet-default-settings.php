<?php 
/*!
 * Jetpack CRM
 * https://jetpackcrm.com
 *
 * MailPoet Sync: Default Settings
 *
 */
return array(

	'import_lists'          => 'all',
	'tag_with_list'         => '1', // tag contact with mailpoet list(s)
	'tag_with_tags'         => '1', // tag contact with mailpoet tag(s)
	'tag_list_prefix'       => 'MailPoet List: ',
	'tag_tag_prefix'        => 'MailPoet Tag: ',
	'autolog_changes'       => '1',
	'delete_action'         => 'none', // delete|delete_save_related_objects|add_note|none

	// status management
	'first_import_complete' => false,
	'resume_from_page'      => 0,
	'last_subscriber_synced'=> false,

);
