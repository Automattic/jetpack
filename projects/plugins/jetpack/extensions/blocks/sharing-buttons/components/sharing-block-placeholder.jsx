import { getRedirectUrl } from '@automattic/jetpack-components';
import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { Button, Placeholder, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';

const icon = getBlockIconComponent( metadata );

export const SharingBlockPlaceholder = ( { changeStatus, isLoading, isModuleActive } ) => {
	return (
		<Placeholder
			icon={ icon }
			instructions={ __(
				"You'll need to activate the Sharing feature to use this block.",
				'jetpack'
			) }
			label={ metadata.title }
		>
			<Button
				disabled={ isModuleActive || isLoading }
				isBusy={ isLoading }
				onClick={ () => changeStatus( true ) }
				variant="secondary"
			>
				{ isLoading
					? __( 'Activating Sharing Buttons', 'jetpack' )
					: __( 'Activate Sharing Buttons', 'jetpack', 0 ) }
			</Button>
			<div className="membership-button__disclaimer">
				<ExternalLink href={ getRedirectUrl( 'jetpack-support-sharing' ) }>
					{ __( 'Learn more about Jetpack Sharing.', 'jetpack' ) }
				</ExternalLink>
			</div>
		</Placeholder>
	);
};
