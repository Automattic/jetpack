import { SelectControl, ToggleControl } from '@wordpress/components';
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

	// Create options for the select control
	const userOptions = eligibleUsers.map( user => ( {
		label: user.name || user.slug,
		value: user.id.toString(),
	} ) );

	// Get the current post author
	const { postAuthorId } = useSelect( select => {
		const { getEditedPostAttribute } = select( editorStore );
		const authorId = getEditedPostAttribute( 'author' );
		return {
			postAuthorId: authorId,
		};
	}, [] );

	return (
		<>
			<ToggleControl
				label={ __( 'Enable form submission notifications', 'jetpack-forms' ) }
				checked={ localFormNotifications }
				onChange={ value => {
					if ( value ) {
						setAttributes( { notificationRecipients: localNotificationRecipients } );
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
					<SelectControl
						label={ __( 'Send notifications to', 'jetpack-forms' ) }
						value={ ( () => {
							if ( localNotificationRecipients.length > 0 ) {
								return localNotificationRecipients[ 0 ];
							}
							if ( postAuthorId && eligibleUsers.some( user => user.id === postAuthorId ) ) {
								return postAuthorId.toString();
							}
							return '';
						} )() }
						options={ userOptions }
						onChange={ userId => {
							const newRecipients = userId ? [ userId ] : [];
							setLocalNotificationRecipients( newRecipients );
							setAttributes( { notificationRecipients: newRecipients } );
						} }
						help={ __( 'Select a user who has access to form responses.', 'jetpack-forms' ) }
						__nextHasNoMarginBottom={ true }
						__next40pxDefaultSize={ true }
					/>
				</>
			) }
		</>
	);
};

export default JetpackFormNotificationsSettings;
