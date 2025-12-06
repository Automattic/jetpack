import { hasFeatureFlag } from '@automattic/jetpack-shared-extension-utils';
import { ToolbarButton } from '@wordpress/components';
import { store as coreStore } from '@wordpress/core-data';
import { useSelect } from '@wordpress/data';
import { __ } from '@wordpress/i18n';
import { backup } from '@wordpress/icons';
import { useConvertToReusableForm } from '../hooks/use-convert-to-reusable-form';

interface ConvertToReusableButtonProps {
	clientId: string;
}

/**
 * Toolbar button to convert a contact form to a reusable form.
 *
 * @param {ConvertToReusableButtonProps} props          - Component props
 * @param {string}                       props.clientId - The client ID of the block to convert
 * @return {JSX.Element | null} The toolbar button or null if feature is disabled
 */
export default function ConvertToReusableButton( {
	clientId,
}: ConvertToReusableButtonProps ): JSX.Element | null {
	// Check if the reusable-forms feature flag is enabled
	const isFeatureEnabled = hasFeatureFlag( 'reusable-forms' );

	// Check if the user has permission to create jetpack-form posts
	const canCreate = useSelect( select => {
		return select( coreStore ).canUser( 'create', {
			kind: 'postType',
			name: 'jetpack-form',
		} );
	}, [] );

	const { convertToReusableForm, isConverting } = useConvertToReusableForm( { clientId } );

	// Don't render the button if feature is disabled or user lacks permissions
	if ( ! isFeatureEnabled || ! canCreate ) {
		return null;
	}

	return (
		<ToolbarButton
			icon={ backup }
			label={ __( 'Convert to Reusable', 'jetpack-forms' ) }
			onClick={ convertToReusableForm }
			disabled={ isConverting }
			isBusy={ isConverting }
		/>
	);
}
