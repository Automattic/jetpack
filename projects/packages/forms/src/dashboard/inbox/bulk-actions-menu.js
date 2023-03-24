import { AntiSpamIcon } from '@automattic/jetpack-components';
import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';

const ActionsMenu = () => {
	return (
		<>
			<Button variant="secondary">{ __( 'Move to trash', 'jetpack-forms' ) }</Button>
			<Button variant="secondary">{ __( 'Mark as spam', 'jetpack-forms' ) }</Button>
			<Button variant="secondary">
				<AntiSpamIcon size="22" />
				{ __( 'Move to trash', 'jetpack-forms' ) }
			</Button>
		</>
	);
};

export default ActionsMenu;
