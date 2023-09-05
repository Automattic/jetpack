/**
 * External dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { Button } from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import { forwardRef, useImperativeHandle, useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall, check, arrowUp } from '@wordpress/icons';
import { Text, View } from 'react-native';
/**
 * Internal dependencies
 */
import styles from './style.native.scss';
// import AiStatusIndicator from '../ai-status-indicator';
// import { GuidelineMessage } from './message';

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
	},
	ref
) {
	const promptUserInputRef = useRef( null );
	const loading = state === 'requesting' || state === 'suggesting';
	const showGuideLine = ! ( loading || disabled || value?.length || isTransparent );

	// Pass the ref to forwardRef.
	useImperativeHandle( ref, () => promptUserInputRef.current );

	// Set up keyboard shortcuts using `useKeyboardShortcut`
	// TODO: do we need this in the mobile version?

	return (
		<View style={ [ styles[ 'ai-control__container' ], shadowStyle ] }>
			<View style={ styles[ 'ai-control__wrapper' ] }>
				{ /* <AiStatusIndicator state={ state } /> */ }
				<View style={ styles[ 'ai-control__input-container' ] }>
					<View style={ styles[ 'ai-control__input-wrapper' ] }>
						<PlainText
							value={ value }
							onChange={ onChange }
							placeholder={ placeholder }
							disabled={ loading || disabled }
							ref={ promptUserInputRef }
							multiline={ true }
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
						<Button
							onClick={ () => onSend( value ) }
							disabled={ ! value?.length || disabled }
							label={ __( 'Send request', 'jetpack-ai-client' ) }
							fixedRatio={ false }
							customContainerStyles={ styles[ 'ai-control__controls-prompt_button' ] }
						>
							<Icon size={ 16 } icon={ arrowUp } />
							<Text style={ styles[ 'ai-control__controls-prompt_button-text' ] }>
								{ __( 'Send', 'jetpack-ai-client' ) }
							</Text>
						</Button>
					) : (
						<Button
							onClick={ onStop }
							label={ __( 'Stop request', 'jetpack-ai-client' ) }
							fixedRatio={ false }
							customContainerStyles={ styles[ 'ai-control__controls-prompt_button' ] }
						>
							<Icon size={ 16 } icon={ closeSmall } />
							<Text style={ styles[ 'ai-control__controls-prompt_button-text' ] }>
								{ __( 'Stop', 'jetpack-ai-client' ) }
							</Text>
						</Button>
					) }
				</View>
				{ showAccept && (
					<View style={ styles[ 'ai-control__controls-prompt_button_container' ] }>
						<Button
							onClick={ onAccept }
							label={ acceptLabel }
							customContainerStyles={ styles[ 'ai-control__controls-prompt_button' ] }
							fixedRatio={ false }
						>
							<Icon size={ 16 } icon={ check } />
							<Text style={ styles[ 'ai-control__controls-prompt_button-text' ] }>
								{ acceptLabel }
							</Text>
						</Button>
					</View>
				) }
			</View>
			{ /* { showGuideLine && <GuidelineMessage /> } */ }
		</View>
	);
}

export default forwardRef( AIControl );
