import { Text } from '@automattic/jetpack-components';
import { __ } from '@wordpress/i18n';
import { Icon, warning } from '@wordpress/icons';
import inProgressImage from '../../../../assets/images/in-progress.png';
import Header from '../header';
import styles from './styles.module.scss';

const ErrorHeader = ( { baseErrorMessage, errorMessage, errorCode } ) => {
	let displayErrorMessage = errorMessage ? `${ errorMessage } (${ errorCode }).` : baseErrorMessage;
	displayErrorMessage += ' ' + __( 'Try again in a few minutes.', 'jetpack-protect' );

	return (
		<Header
			heading={
				<>
					<Icon className={ styles.warning } icon={ warning } size={ 54 } />
					{ __( 'An error occurred', 'jetpack-protect' ) }
				</>
			}
			subheading={ <Text>{ displayErrorMessage }</Text> }
			showNavigation={ true }
			secondary={
				<div className={ styles.illustration }>
					<img src={ inProgressImage } alt="" />
				</div>
			}
		/>
	);
};

export default ErrorHeader;
