/**
 * External dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { forwardRef, useImperativeHandle, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall, check, arrowUp } from '@wordpress/icons';
import { ActivityIndicator, TouchableOpacity, Text, View } from 'react-native';
/**
 * Internal dependencies
 */
import AiStatusIndicator from '../ai-status-indicator';
import { GuidelineMessage } from './message';
import styles from './style.native.scss';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

const shadowStyle = {
	shadowColor: '#000',
	shadowOffset: {
		width: 0,
		height: 2,
	},
	shadowOpacity: 0.25,
	shadowRadius: 3.84,

	elevation: 5,
};

const ControlButton = ( { label, hint, disabled, onPress, icon, text, style } ) => {
	return (
		<TouchableOpacity
			accessibilityLabel={ label }
			style={ [
				styles[ 'ai-control__controls-prompt_button' ],
				style,
				{ opacity: disabled ? 0.3 : 1 },
			] }
			accessibilityRole={ 'button' }
			accessibilityHint={ hint }
			onPress={ onPress }
			disabled={ disabled }
		>
			<>
				<Icon size={ 16 } icon={ icon } />
				<Text style={ styles[ 'ai-control__controls-prompt_button-text' ] }>{ text }</Text>
			</>
		</TouchableOpacity>
	);
};

export function AIControl(
	{
		disabled = false,
		value = '',
		placeholder = '',
		showAccept = false,
		acceptLabel = __( 'Accept', 'jetpack-ai-client' ),
		isTransparent = false,
		state = 'init',
		showClearButton = true,
		onChange = noop,
		onSend = noop,
		onStop = noop,
		onAccept = noop,
		onFocus = noop,
	},
	ref
) {
	const promptUserInputRef = useRef( null );
	const loading = state === 'requesting' || state === 'suggesting';
	const showGuideLine = ! ( loading || disabled || value?.length || isTransparent );

	// Pass the ref to forwardRef.
	useImperativeHandle( ref, () => promptUserInputRef.current );

	return (
		<View style={ [ styles[ 'ai-control__container' ], shadowStyle ] }>
			<View style={ styles[ 'ai-control__wrapper' ] }>
				<View style={ styles[ 'ai-control__input-container' ] }>
					<AiStatusIndicator state={ state } />
					<View style={ styles[ 'ai-control__input-wrapper' ] }>
						<PlainText
							value={ value }
							onChange={ onChange }
							placeholder={ placeholder }
							editable={ ! loading && ! disabled }
							ref={ promptUserInputRef }
							multiline={ true }
							onFocus={ onFocus }
						/>
					</View>
					{ value?.length > 0 && showClearButton && (
						<Button
							customContainerStyles={ styles[ 'ai-control__input-close-button' ] }
							iconSize={ 18 }
							icon={ closeSmall }
							onClick={ () => onChange( '' ) }
						/>
					) }
				</View>
				<View style={ styles[ 'ai-control__controls-prompt_button_container' ] }>
					{ ! loading ? (
						<>
							<ControlButton
								label={ __( 'Send request', 'jetpack-ai-client' ) }
								hint={ __( 'Double tap to send request', 'jetpack-ai-client' ) }
								onPress={ () => onSend( value ) }
								disabled={ ! value?.length || disabled }
								icon={ arrowUp }
								text={ __( 'Send', 'jetpack-ai-client' ) }
							/>
						</>
					) : (
						<>
							<ControlButton
								label={ __( 'Stop request', 'jetpack-ai-client' ) }
								onPress={ onStop }
								icon={ closeSmall }
								text={ __( 'Stop', 'jetpack-ai-client' ) }
							/>
							<View style={ styles[ 'ai-control__input-loading' ] }>
								<ActivityIndicator />
							</View>
						</>
					) }
					{ showAccept && (
						<ControlButton
							label={ acceptLabel }
							onPress={ onAccept }
							icon={ check }
							text={ acceptLabel }
							style={ styles[ 'ai-control__controls-prompt_button-accept' ] }
						/>
					) }
				</View>
			</View>
			{ showGuideLine && <GuidelineMessage /> }
		</View>
	);
}

export default forwardRef( AIControl );
