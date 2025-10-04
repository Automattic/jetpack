import { FormTokenField, ToggleControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { store as editorStore } from '@wordpress/editor';
import { useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import InspectorHint from '../../shared/components/inspector-hint';

const JetpackFormNotificationsSettings = ( { setAttributes, notificationRecipients } ) => {
	const [ localNotificationRecipients, setLocalNotificationRecipients ] =
		useState( notificationRecipients );
	const [ localFormNotifications, setLocalFormNotifications ] = useState(
		notificationRecipients?.length > 0
	);

	// Fetch users who can edit posts (editors and admins)
	const users = useSelect( select => {
		const { getUsers } = select( coreStore );
		return getUsers( { who: 'authors', per_page: -1 } ) || [];
	}, [] );

	// Filter to only include users with edit capabilities (editors and admins)
	const eligibleUsers = users.filter( user => {
		return user.capabilities?.edit_posts || user.capabilities?.edit_pages;
	} );

	// Create a map of user ID to user name for easy lookup
	const userMap = {};
	eligibleUsers.forEach( user => {
		userMap[ user.id.toString() ] = user.name || user.slug;
	} );

	// Get the current post author
	const { postAuthorId } = useSelect( select => {
		const { getEditedPostAttribute } = select( editorStore );
		const authorId = getEditedPostAttribute( 'author' );
		return {
			postAuthorId: authorId,
		};
	}, [] );

	// Convert user IDs to names for display
	const selectedUserNames = localNotificationRecipients
		.filter( userId => userMap[ userId ] )
		.map( userId => userMap[ userId ] );

	// All available user names for suggestions
	const allUserNames = eligibleUsers.map( user => user.name || user.slug );

	return (
		<>
			<ToggleControl
				label={ __( 'Enable form submission notifications', 'jetpack-forms' ) }
				checked={ localFormNotifications }
				onChange={ value => {
					if ( value ) {
						// Auto-select post author when enabling notifications
						const authorIdStr = postAuthorId?.toString();
						let recipientsToSet = localNotificationRecipients;

						if (
							recipientsToSet.length === 0 &&
							authorIdStr &&
							eligibleUsers.some( user => user.id === postAuthorId )
						) {
							recipientsToSet = [ authorIdStr ];
						}

						setLocalNotificationRecipients( recipientsToSet );
						setAttributes( { notificationRecipients: recipientsToSet } );
					} else {
						setAttributes( { notificationRecipients: [] } );
					}
					setLocalFormNotifications( value );
				} }
				__nextHasNoMarginBottom={ true }
			/>
			{ localFormNotifications && (
				<>
					<InspectorHint>
						{ __( 'Select users who can receive form submission notifications:', 'jetpack-forms' ) }
					</InspectorHint>
					<FormTokenField
						label={ __( 'Send notifications to', 'jetpack-forms' ) }
						value={ selectedUserNames }
						suggestions={ allUserNames }
						onChange={ selectedNames => {
							// Convert user names back to IDs
							const newRecipients = selectedNames
								.map( name => {
									const user = eligibleUsers.find( u => ( u.name || u.slug ) === name );
									return user ? user.id.toString() : null;
								} )
								.filter( Boolean );
							setLocalNotificationRecipients( newRecipients );
							setAttributes( { notificationRecipients: newRecipients } );
						} }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
				</>
			) }
		</>
	);
};

export default JetpackFormNotificationsSettings;
