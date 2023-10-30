import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { Button, Placeholder, ExternalLink } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import metadata from '../block.json';

const icon = getBlockIconComponent( metadata );

export const WordAdsPlaceholder = ( { changeStatus, isLoading, isModuleActive } ) => {
	return (
		<Placeholder
			icon={ icon }
			instructions={ __(
				"You'll need to activate the WordAds feature to use this block.",
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
					? __( 'Activating WordAds', 'jetpack' )
					: __( 'Activate WordAds', 'jetpack', 0 ) }
			</Button>
			<div className="membership-button__disclaimer">
				<ExternalLink href="https://jetpack.com/support/ads/">
					{ __( 'Learn more about the WordAds feature.', 'jetpack' ) }
				</ExternalLink>
			</div>
		</Placeholder>
	);
};
