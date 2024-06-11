/**
 * External dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import clsx from 'clsx';
import React from 'react';
/**
 * Internal dependencies
 */
import AiStatusIndicator from '../ai-status-indicator/index.js';
import './style.scss';
/**
 * Types
 */
import type { RequestingStateProp } from '../../types.js';
import type { ReactElement } from 'react';

type AIControlProps = {
	className?: string;
	disabled?: boolean;
	value: string;
	placeholder?: string;
	isTransparent?: boolean;
	state?: RequestingStateProp;
	onChange?: ( newValue: string ) => void;
	banner?: ReactElement;
	error?: ReactElement;
	actions?: ReactElement;
	message?: ReactElement;
	promptUserInputRef?: React.MutableRefObject< HTMLInputElement >;
	wrapperRef?: React.MutableRefObject< HTMLDivElement | null >;
};

/**
 * Base AIControl component. Contains the main structure of the control component and slots for banner, error, actions and message.
 *
 * @param {AIControlProps} props - Component props
 * @returns {ReactElement}       Rendered component
 */
export default function AIControl( {
	className,
	disabled = false,
	value = '',
	placeholder = '',
	isTransparent = false,
	state = 'init',
	onChange,
	banner = null,
	error = null,
	actions = null,
	message = null,
	promptUserInputRef = null,
	wrapperRef = null,
}: AIControlProps ): ReactElement {
	return (
		<div
			className={ clsx( 'jetpack-components-ai-control__container-wrapper', className ) }
			ref={ wrapperRef }
		>
			{ error }
			<div className="jetpack-components-ai-control__container">
				{ banner }
				<div
					className={ clsx( 'jetpack-components-ai-control__wrapper', {
						'is-transparent': isTransparent,
					} ) }
				>
					<AiStatusIndicator state={ state } />

					<div className="jetpack-components-ai-control__input-wrapper">
						<PlainText
							value={ value }
							onChange={ onChange }
							placeholder={ placeholder }
							className="jetpack-components-ai-control__input"
							disabled={ disabled }
							ref={ promptUserInputRef }
						/>
					</div>
					{ actions }
				</div>
				{ message }
			</div>
		</div>
	);
}
