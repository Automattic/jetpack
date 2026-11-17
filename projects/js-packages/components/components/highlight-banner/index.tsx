import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import clsx from 'clsx';
import './style.scss';
import type { HighlightBannerProps } from './types.ts';
import type { FC } from 'react';

/**
 * Jetpack's dark green banner with gradient orbs, for announcing or explaining what a page offers.
 *
 * @param {HighlightBannerProps} props - Component props.
 * @return The rendered banner.
 */
const HighlightBanner: FC< HighlightBannerProps > = ( {
	className,
	title,
	description,
	actions,
	onDismiss,
	dismissLabel,
} ) => (
	<div className={ clsx( 'jp-highlight-banner', className ) }>
		<div className="jp-highlight-banner__content">
			<h2 className="jp-highlight-banner__title">{ title }</h2>
			{ description && <p className="jp-highlight-banner__description">{ description }</p> }
			{ actions && <div className="jp-highlight-banner__actions">{ actions }</div> }
		</div>
		{ onDismiss && (
			<Button
				className="jp-highlight-banner__close"
				icon={ closeSmall }
				label={ dismissLabel ?? __( 'Dismiss banner', 'jetpack-components' ) }
				size="small"
				onClick={ onDismiss }
			/>
		) }
		<div className="jp-highlight-banner__orb jp-highlight-banner__orb--top" aria-hidden="true" />
		<div className="jp-highlight-banner__orb jp-highlight-banner__orb--bottom" aria-hidden="true" />
	</div>
);

export default HighlightBanner;
