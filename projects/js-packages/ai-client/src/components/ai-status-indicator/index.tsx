/**
 * External dependencies
 */
import { Icon } from '@wordpress/components';
import classNames from 'classnames';
/*
 * Internal dependencies
 */
import { aiAssistantIcon } from '../../icons';
/*
 * Types
 */
import type { RequestingStateProp } from '../../types';
export type AiStatusIndicatorIconSize = 24 | 32 | 48 | 64;
import type React from 'react';

import './style.scss';

export type AiStatusIndicatorProps = {
	requestingState?: RequestingStateProp;
	size?: AiStatusIndicatorIconSize;
};

/**
 * AiStatusIndicator component.
 *
 * @param {AiStatusIndicatorProps} props - component props.
 * @returns {React.ReactElement} - rendered component.
 */
export default function AiStatusIndicator( {
	requestingState,
	size = 24,
}: AiStatusIndicatorProps ): React.ReactElement {
	return (
		<div className="jetpack-ai-status-indicator__container">
			<div
				className={ classNames( 'jetpack-ai-status-indicator__icon-wrapper', {
					[ `is-${ requestingState }` ]: true,
				} ) }
			>
				<Icon icon={ aiAssistantIcon } size={ size } />
			</div>
		</div>
	);
}
