import { __, isRTL } from '@wordpress/i18n';
import { arrowLeft, arrowRight } from '@wordpress/icons';
import { Icon, Link, Stack } from '@wordpress/ui';
import { useBoostNavigation } from '$lib/navigation/navigation-context';
import { recordBoostEvent } from '$lib/utils/analytics';

/**
 * A visible route back to Settings, like the legacy page's "Go back" button.
 */
const BackToSettingsLink = () => {
	const { returnToSettings, settingsHref } = useBoostNavigation();

	const handleBack = ( e: React.MouseEvent ) => {
		e.preventDefault();
		recordBoostEvent( 'back_button_clicked', {
			current_page: window.location.href.replace( window.location.origin, '' ),
			destination: '/',
		} );
		returnToSettings();
	};

	return (
		<Stack
			render={ <Link href={ settingsHref } onClick={ handleBack } /> }
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
