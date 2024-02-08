jQuery( document ).ready( function ( $ ) {
	// Populate the new user form locale dropdown value
	var localeDropdownOptions = $.map( $( '#createuser #locale option' ), function ( option ) {
		return option.value;
	} );

	if ( window.jetpackSSOAdminCreateUser && 'locale' in window.jetpackSSOAdminCreateUser ) {
		var postDataLocaleValue = window.jetpackSSOAdminCreateUser.locale;
		var currentNewUserFormLocaleValue = $( '#createuser #locale' ).val();

		if (
			localeDropdownOptions.includes( postDataLocaleValue ) &&
			postDataLocaleValue !== currentNewUserFormLocaleValue
		) {
			// Set the locale dropdown value to the value from the post data
			$( '#createuser #locale' ).val( postDataLocaleValue );
		}
	}
} );
