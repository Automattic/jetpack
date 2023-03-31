/**
 * External dependencies
 */
import { Spinner } from '@wordpress/components';
import { Icon, warning } from '@wordpress/icons';
/**
 * Types
 */
import type React from 'react';

import './style.scss';

export type BlockBannerProps = {
	icon?: React.ReactNode;
	action?: React.ReactNode;
	children: React.ReactNode;
	isLoading?: boolean;
};

/**
 * React component to render a banner above a block.
 *
 * @param {BlockBannerProps} props         - Component props.
 * @param {React.ReactNode} props.action   - Banner action button.
 * @param {React.ReactNode} props.children - Banner content.
 * @param {React.ReactNode} props.icon     - Banner icon.
 * @returns {React.ReactElement }            Banner component.
 */
export default function BlockBanner( {
	icon = warning,
	action,
	children,
	isLoading,
}: BlockBannerProps ): React.ReactElement {
	return (
		<div className="block-banner">
			<Icon icon={ icon } />
			<div className="block-banner__content">{ children }</div>
			{ isLoading && <Spinner /> }
			{ action && <div className="block-banner__action">{ action }</div> }
		</div>
	);
}
