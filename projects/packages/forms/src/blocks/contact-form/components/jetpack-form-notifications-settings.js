import { SelectControl, ToggleControl } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import InspectorHint from '../../shared/components/inspector-hint';

const JetpackFormNotificationsSettings = ( {
	formNotifications = true,
	notificationRecipients = [],
	setAttributes,
} ) => {
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

	return (
		<>
			<ToggleControl
				label={ __( 'Enable form submission notifications', 'jetpack-forms' ) }
				checked={ formNotifications }
				onChange={ value => setAttributes( { formNotifications: value } ) }
				__nextHasNoMarginBottom={ true }
			/>
			{ formNotifications && (
				<>
					<InspectorHint>
						{ __( 'Select users who can receive form submission notifications:', 'jetpack-forms' ) }
					</InspectorHint>
					<SelectControl
						label={ __( 'Send notifications to', 'jetpack-forms' ) }
						value={ notificationRecipients.length > 0 ? notificationRecipients[ 0 ] : '' }
						options={ [
							{ label: __( 'Select a user', 'jetpack-forms' ), value: '' },
							...userOptions,
						] }
						onChange={ userId => {
							const newRecipients = userId ? [ userId ] : [];
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
