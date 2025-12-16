/**
 * External dependencies
 */
import clsx from 'clsx';
import { forwardRef } from 'react';

/**
 * Type definitions
 */
type NavigableRegionProps = {
	children: React.ReactNode;
	className?: string;
	ariaLabel: React.ReactNode;
	as?: React.ElementType;
	// eslint-disable-next-line @typescript-eslint/no-explicit-any
	[ key: string ]: any;
};

// This is a copy of the private `NavigableRegion` component from the '@wordpress/editor' private APIs.
const NavigableRegion = forwardRef< HTMLElement, NavigableRegionProps >(
	( { children, className, ariaLabel, as: Tag = 'div', ...props }, ref ) => {
		return (
			<Tag
				ref={ ref }
				className={ clsx( 'admin-ui-navigable-region', className ) }
				aria-label={ typeof ariaLabel === 'string' ? ariaLabel : undefined }
				role="region"
				tabIndex={ -1 }
				{ ...props }
			>
				{ children }
			</Tag>
		);
	}
);

NavigableRegion.displayName = 'NavigableRegion';

export default NavigableRegion;
