import { getBlockIconComponent } from '@automattic/jetpack-shared-extension-utils';
import { Placeholder } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { Button, Link, Stack } from '@wordpress/ui';
import metadata from '../block.json';

const icon = getBlockIconComponent( metadata );

export const WordAdsPlaceholder = ( { changeStatus, isLoading, isModuleActive } ) => {
	const activateLabel = __( 'Activate WordAds', 'jetpack', 0 );
	const activatingLabel = __( 'Activating WordAds', 'jetpack' );

	return (
		<Placeholder
			icon={ icon }
			instructions={ __(
				"You'll need to activate the WordAds feature to use this block.",
				'jetpack'
			) }
			label={ metadata.title }
		>
			<Stack gap="lg" direction="column" align="start">
				<Button
					disabled={ isModuleActive || isLoading }
					loading={ isLoading }
					loadingAnnouncement={ activatingLabel }
					onClick={ () => changeStatus( true ) }
					variant="outline"
				>
					{ isLoading ? activatingLabel : activateLabel }
				</Button>
				<Link openInNewTab href="https://jetpack.com/support/ads/">
					{ __( 'Learn more about the WordAds feature.', 'jetpack' ) }
				</Link>
			</Stack>
		</Placeholder>
	);
};
