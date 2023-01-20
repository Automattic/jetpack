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

type BlockBannerProps = {
	icon?: React.ReactNode;
	children: React.ReactNode;
	isLoading?: boolean;
};

/**
 * React component to render a banner above a block.
 *
 * @param {BlockBannerProps} props         - Component props.
 * @param {React.ReactNode} props.children - Banner content.
 * @param {React.ReactNode} props.icon     - Banner icon.
 * @returns {React.ReactElement }            Banner component.
 */
export default function BlockBanner( {
	icon = warning,
	children,
	isLoading,
}: BlockBannerProps ): React.ReactElement {
	return (
		<div className="block-banner">
			<Icon icon={ icon } />
			<div className="block-banner__content">{ children }</div>
			{ isLoading && <Spinner /> }
		</div>
	);
}
