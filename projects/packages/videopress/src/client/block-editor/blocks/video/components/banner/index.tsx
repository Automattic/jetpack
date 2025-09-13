/**
 * External dependencies
 */
import { Spinner } from '@wordpress/components';
import { Icon, warning } from '@wordpress/icons';
/**
 * Types
 */
import type { ReactElement, ReactNode } from 'react';

import './style.scss';

export type BlockBannerProps = {
	icon?: ReactNode;
	action?: ReactNode;
	children: ReactNode;
	isLoading?: boolean;
};

/**
 * React component to render a banner above a block.
 *
 * @param {BlockBannerProps} props          - Component props.
 * @param {ReactNode}        props.action   - Banner action button.
 * @param {ReactNode}        props.children - Banner content.
 * @param {ReactNode}        props.icon     - Banner icon.
 * @return {ReactElement }            Banner component.
 */
export default function BlockBanner( {
	icon = warning,
	action,
	children,
	isLoading,
}: BlockBannerProps ): ReactElement {
	return (
		<div className="block-banner">
			{ icon && <Icon icon={ icon } /> }
			<div className="block-banner__content">{ children }</div>
			{ isLoading && <Spinner /> }
			{ action && <div className="block-banner__action">{ action }</div> }
		</div>
	);
}
