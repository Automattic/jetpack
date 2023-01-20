/**
 * External dependencies
 */
import { Icon, warning } from '@wordpress/icons';
/**
 * Types
 */
import type React from 'react';

import './style.scss';

type BlockBannerProps = {
	icon?: React.ReactNode;
	children: React.ReactNode;
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
}: BlockBannerProps ): React.ReactElement {
	return (
		<div className="block-banner">
			<Icon icon={ icon } />
			{ children }
		</div>
	);
}
