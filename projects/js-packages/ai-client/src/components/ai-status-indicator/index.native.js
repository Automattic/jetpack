/**
 * External dependencies
 */
import { Icon } from '@wordpress/components';
import { View } from 'react-native';
/*
 * Internal dependencies
 */
import { aiAssistantIcon } from '../../icons';
import styles from './styles';

/**
 * AiStatusIndicator component.
 *
 * @param {object} props - component props.
 * @param {import('../../types').RequestingStateProp} [props.state] - requesting state.
 * @param {24 | 32 | 48 | 64} [props.size] - icon size.
 * @returns {import('react').ReactElement} - React component.
 */
export default function AiStatusIndicator( { state = 'init', size = 24 } ) {
	return (
		<View style={ { position: 'absolute' } }>
			<Icon
				icon={ aiAssistantIcon }
				size={ size }
				style={ styles[ `ai-status-indicator__icon--is-${ state }` ] }
			/>
		</View>
	);
}
