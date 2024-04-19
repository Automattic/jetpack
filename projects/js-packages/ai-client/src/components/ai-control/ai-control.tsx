/**
 * External dependencies
 */
import { PlainText } from '@wordpress/block-editor';
import classNames from 'classnames';
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
	disabled?: boolean;
	value: string;
	placeholder?: string;
	isTransparent?: boolean;
	state?: RequestingStateProp;
	onChange?: ( newValue: string ) => void;
	bannerComponent?: ReactElement;
	errorComponent?: ReactElement;
	actions?: ReactElement;
	message?: ReactElement;
	promptUserInputRef?: React.MutableRefObject< HTMLInputElement >;
};

/**
 * Base AIControl component. Contains the main structure of the control component and slots for banner, error, actions and message.
 *
 * @param {AIControlProps} props - Component props
 * @returns {ReactElement}       Rendered component
 */
export default function AIControl( {
	disabled = false,
	value = '',
	placeholder = '',
	isTransparent = false,
	state = 'init',
	onChange,
	bannerComponent = null,
	errorComponent = null,
	actions = null,
	message = null,
	promptUserInputRef = null,
}: AIControlProps ): ReactElement {
	return (
		<div className="jetpack-components-ai-control__container-wrapper">
			{ errorComponent }
			<div className="jetpack-components-ai-control__container">
				{ bannerComponent }
				<div
					className={ classNames( 'jetpack-components-ai-control__wrapper', {
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
