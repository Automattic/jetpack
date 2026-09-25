import { __, isRTL } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { Icon, Link, Stack } from '@wordpress/ui';
import { useBackToSettings } from '$lib/navigation/use-back-to-settings';

/**
 * A visible route back to Settings, like the legacy page's "Go back" button.
 */
const BackToSettingsLink = () => {
	const { href, onClick } = useBackToSettings( 'back_link' );

	return (
		<Stack
			render={ <Link href={ href } onClick={ onClick } /> }
			direction="row"
			gap="xs"
			align="center"
			style={ { alignSelf: 'flex-start' } }
		>
			<Icon icon={ isRTL() ? arrowRight : arrowLeft } size={ 20 } />
			{ __( 'Back to settings', 'jetpack-boost' ) }
		</Stack>
	);
};

export default BackToSettingsLink;
