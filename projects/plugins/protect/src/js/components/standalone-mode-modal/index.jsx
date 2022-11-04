import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';

const StandaloneModeModal = () => {
	return (
		<>
			<Text variant="title-medium" mb={ 2 }>
				{ __( 'Enhanced protection', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 3 }>
				{ __(
					'Learn how you can execute Jetpack Firewall before WordPress initializes. This mode offers the most protection.',
					'jetpack-protect'
				) }
			</Text>
			<ul>
				<li>
					{ __(
						'To ensure the firewall can best protect your site, please update: auto_prepend_file PHP directive to point to src/users/user66501445/public/wp-content/jetpack-waf/bootstrap.php Typically this is set either in an .htaccess file or in the gloabel PHP configuration; contact your host for further assistance.',
						'jetpack-protect'
					) }
				</li>
				<li>
					{ __(
						"Don't forget to undo this action when Firewall is turned off, or when you uninstall Jetpack.",
						'jetpack-protect'
					) }
				</li>
			</ul>
		</>
	);
};

export default StandaloneModeModal;
