import { useDataSync } from '@automattic/jetpack-react-data-sync-client';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Notice } from '@wordpress/ui';
import { z } from 'zod';
import { useSingleModuleState } from '$features/module/lib/stores';

export const useCloudCssUpgradeNotice = () =>
	useDataSync( 'jetpack_boost_ds', 'cloud_css_upgrade_notice', z.boolean() );

const CloudCssUpgradeNotice = () => {
	const [ { data: pending }, { mutate: setPending } ] = useCloudCssUpgradeNotice();
	const [ cloudCss ] = useSingleModuleState( 'cloud_css' );

	if ( ! pending || ! cloudCss?.active || ! cloudCss.available ) {
		return null;
	}

	return (
		<Notice.Root intent="success">
			<Notice.Title>
				{ __( 'Congratulations! Your Jetpack Boost is Now Upgraded!', 'jetpack-boost' ) }
			</Notice.Title>
			<Notice.Description>
				{ createInterpolateElement(
					__(
						'<strong>Automatic Critical CSS:</strong> No further action needed! Your Critical CSS is now set to auto-regenerate.',
						'jetpack-boost'
					),
					{ strong: <strong /> }
				) }
			</Notice.Description>
			<Notice.CloseIcon
				onClick={ () => setPending( false ) }
				label={ __( 'Dismiss', 'jetpack-boost' ) }
			/>
		</Notice.Root>
	);
};

export default CloudCssUpgradeNotice;
