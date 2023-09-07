/**
 * External dependencies
 */
import { __ } from '@wordpress/i18n';
import {
	Icon,
	warning,
	info,
	cancelCircleFilled as error,
	check as success,
} from '@wordpress/icons';
import { Linking, Text, View } from 'react-native';
import styles from './style.native.scss';

export const MESSAGE_SEVERITY_WARNING = 'warning';
export const MESSAGE_SEVERITY_ERROR = 'error';
export const MESSAGE_SEVERITY_SUCCESS = 'success';
export const MESSAGE_SEVERITY_INFO = 'info';

const messageIconsMap = {
	[ MESSAGE_SEVERITY_WARNING ]: warning,
	[ MESSAGE_SEVERITY_ERROR ]: error,
	[ MESSAGE_SEVERITY_SUCCESS ]: success,
	[ MESSAGE_SEVERITY_INFO ]: info,
};

/**
 * React component to render a block message.
 *
 * @param {object} props - Component props.
 * @param {string[]} [props.severity] - Severity of the message.
 * @param {import('react').ReactNode} [props.icon] - Custom icon.
 * @param {import('react').ReactNode} [props.children] - Children to render.
 * @returns {import('react').ReactElement}    Banner component.
 */
export default function Message( { severity = null, icon = null, children } ) {
	return (
		<View style={ styles[ 'ai-assistant__message' ] }>
			{ ( severity || icon ) && (
				<Icon
					icon={ messageIconsMap[ severity ] || icon }
					color={ styles[ 'ai-assistant__message-icon' ].fill }
				/>
			) }
			<View style={ styles[ 'ai-assistant__message-content' ] }>{ children }</View>
		</View>
	);
}

/**
 * React component to render a guideline message.
 *
 * @returns {import('react').ReactElement} - Message component.
 */
export function GuidelineMessage() {
	return (
		<Message severity={ MESSAGE_SEVERITY_INFO }>
			<Text
				style={ styles[ 'ai-assistant__message-text' ] }
				onPress={ () => {
					Linking.openURL( 'https://automattic.com/ai-guidelines' );
				} }
			>
				{ __( 'AI-generated content could be inaccurate or biased.', 'jetpack-ai-client' ) }
				{ '\n' }
				<Text style={ styles[ 'ai-assistant__message-external-link' ] }>
					{ __( 'Click to learn more.', 'jetpack-ai-client' ) }
				</Text>
			</Text>
		</Message>
	);
}
