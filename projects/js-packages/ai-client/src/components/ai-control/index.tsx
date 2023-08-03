/**
 * External dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import { Button, Spinner } from '@wordpress/components';
import { useKeyboardShortcut } from '@wordpress/compose';
import { useRef } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { Icon, closeSmall, check, arrowUp } from '@wordpress/icons';
import classNames from 'classnames';
/**
 * Internal dependencies
 */
import { aiAssistantIcon } from '../../icons';
import './style.scss';

// eslint-disable-next-line @typescript-eslint/no-empty-function
const noop = () => {};

/**
 * AI Control component.
 *
 * @param {object} props - component props
 * @param {boolean} props.loading - loading state
 * @param {string} props.value - input value
 * @param {string} props.placeholder - input placeholder
 * @param {boolean} props.showAccept - show accept button
 * @param {string} props.acceptLabel - accept button label
 * @param {boolean} props.showButtonsLabel - show buttons label
 * @param {boolean} props.isOpaque - is opaque
 * @param {Function} props.onChange - input change handler
 * @param {Function} props.onSend - send request handler
 * @param {Function} props.onStop - stop request handler
 * @param {Function} props.onAccept - accept handler
 * @returns {object} - AI Control component
 */
export default function AIControl( {
	loading = false,
	value = '',
	placeholder = '',
	showAccept = false,
	acceptLabel = __( 'Accept', 'jetpack-ai-client' ),
	showButtonsLabel = true,
	isOpaque = false,
	onChange = noop,
	onSend = noop,
	onStop = noop,
	onAccept = noop,
}: {
	loading?: boolean;
	value: string;
	placeholder?: string;
	showAccept?: boolean;
	acceptLabel?: string;
	showButtonsLabel?: boolean;
	isOpaque?: boolean;
	onChange?: ( newValue: string ) => void;
	onSend?: ( currentValue: string ) => void;
	onStop?: () => void;
	onAccept?: () => void;
} ) {
	const promptUserInputRef = useRef( null );

	useKeyboardShortcut(
		'mod+enter',
		() => {
			if ( showAccept ) {
				onAccept?.();
			}
		},
		{
			target: promptUserInputRef,
		}
	);

	useKeyboardShortcut(
		'enter',
		e => {
			e.preventDefault();
			onSend?.( value );
		},
		{
			target: promptUserInputRef,
		}
	);

	return (
		<div className="jetpack-components-ai-control__container">
			<div
				className={ classNames( 'jetpack-components-ai-control__wrapper', {
					'is-opaque': isOpaque,
				} ) }
			>
				<div className="jetpack-components-ai-controlton__icon">
					{ loading ? (
						<Spinner className="input-spinner" />
					) : (
						<Icon className="input-icon" icon={ aiAssistantIcon } size={ 24 } />
					) }
				</div>

				<div className="jetpack-components-ai-control__input-wrapper">
					<PlainText
						value={ value }
						onChange={ onChange }
						placeholder={ placeholder }
						className="jetpack-components-ai-control__input"
						disabled={ loading }
						ref={ promptUserInputRef }
					/>

					{ value?.length > 0 && (
						<Icon
							icon={ closeSmall }
							className="jetpack-components-ai-control__clear"
							onClick={ () => onChange( '' ) }
						/>
					) }
				</div>

				<div className="jetpack-components-ai-control__controls">
					<div className="jetpack-components-ai-control__controls-prompt_button_wrapper">
						{ ! loading ? (
							<Button
								className="jetpack-components-ai-control__controls-prompt_button"
								onClick={ () => onSend( value ) }
								isSmall={ true }
								disabled={ ! value?.length }
								label={ __( 'Send request', 'jetpack-ai-client' ) }
							>
								<Icon icon={ arrowUp } />
								{ showButtonsLabel && __( 'Send', 'jetpack-ai-client' ) }
							</Button>
						) : (
							<Button
								className="jetpack-components-ai-control__controls-prompt_button"
								onClick={ onStop }
								isSmall={ true }
								label={ __( 'Stop request', 'jetpack-ai-client' ) }
							>
								<Icon icon={ closeSmall } />
								{ showButtonsLabel && __( 'Stop', 'jetpack-ai-client' ) }
							</Button>
						) }
					</div>

					{ showAccept && (
						<div className="jetpack-components-ai-control__controls-prompt_button_wrapper">
							<Button
								className="jetpack-components-ai-control__controls-prompt_button"
								onClick={ onAccept }
								isSmall={ true }
								label={ acceptLabel }
							>
								<Icon icon={ check } />
								{ acceptLabel }
							</Button>
						</div>
					) }
				</div>
			</div>
		</div>
	);
}
