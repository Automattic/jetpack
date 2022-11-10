import { Text } from '@automattic/jetpack-components';
import { createInterpolateElement } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import styles from './styles.module.scss';

const StandaloneModeModal = () => {
	return (
		<>
			<Text variant={ 'title-medium-semi-bold' } mb={ 2 }>
				{ __( 'Enhanced protection', 'jetpack-protect' ) }
			</Text>
			<Text mb={ 2 }>
				{ __(
					'Learn how you can execute Jetpack Firewall before WordPress initializes. This mode offers the most protection.',
					'jetpack-protect'
				) }
			</Text>
			<ul className={ styles.list }>
				<li className={ styles[ 'list-item' ] }>
					<Text variant={ 'body-small' }>
						{ createInterpolateElement(
							__(
								'To ensure the firewall can best protect your site, please update: <mark>auto_prepend_file</mark> PHP directive to point to <mark>src/users/user66501445/public/wp-content/jetpack-waf/bootstrap.php</mark> Typically this is set either in an .htaccess file or in the global PHP configuration; contact your host for further assistance.',
								'jetpack-protect'
							),
							{
								mark: <mark className={ styles.mark } />,
							}
						) }
					</Text>
				</li>
				<li className={ styles[ 'list-item' ] }>
					<Text variant={ 'body-small' }>
						{ __(
							"Don't forget to undo this action when Firewall is turned off, or when you uninstall Jetpack.",
							'jetpack-protect'
						) }
					</Text>
				</li>
			</ul>
		</>
	);
};

export default StandaloneModeModal;
