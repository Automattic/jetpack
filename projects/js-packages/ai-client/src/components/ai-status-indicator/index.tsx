/**
 * External dependencies
 */
import { Spinner } from '@wordpress/components';
import clsx from 'clsx';
/*
 * Types
 */
import type { RequestingStateProp } from '../../types.ts';
export type AiStatusIndicatorIconSize = 24 | 32 | 48 | 64;
import type React from 'react';

import './style.scss';

export type AiStatusIndicatorProps = {
	state?: RequestingStateProp;
	size?: AiStatusIndicatorIconSize;
};

/**
 * AiStatusIndicator component.
 *
 * @param {AiStatusIndicatorProps} props - component props.
 * @return {React.ReactElement} - rendered component.
 */
export default function AiStatusIndicator( { state }: AiStatusIndicatorProps ): React.ReactElement {
	return (
		<div
			className={ clsx( 'jetpack-ai-status-indicator__icon-wrapper', {
				[ `is-${ state }` ]: true,
			} ) }
		>
			<Spinner />
		</div>
	);
}
