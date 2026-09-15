/**
 * Dark-green AI banner: the shared shell behind the AI announcement banners
 * (AI Overview's assistant banner, Content Guidelines' empty-state banner).
 * Renders the rounded dark background, the two gradient orbs, and a close X,
 * with the caller's title/description/actions layered above.
 */

import { Button } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { closeSmall } from '@wordpress/icons';
import clsx from 'clsx';

import './style.scss';

/**
 * Dark AI banner shell.
 *
 * @param {object}   props              - Component props.
 * @param {string}   props.className    - Extra class for layout overrides (width, margins).
 * @param {string}   props.title        - Banner heading.
 * @param {string}   props.description  - Supporting copy under the heading.
 * @param {object}   props.actions      - Optional action buttons, rendered in a row under the copy.
 * @param {Function} props.onDismiss    - Called when the close X is clicked.
 * @param {string}   props.dismissLabel - Accessible label for the close X.
 * @return {object} Component markup.
 */
export default function AiBanner( {
	className,
	title,
	description,
	actions,
	onDismiss,
	dismissLabel,
} ) {
	return (
		<div className={ clsx( 'jetpack-ai-banner', className ) }>
			<div className="jetpack-ai-banner__content">
				<h2 className="jetpack-ai-banner__title">{ title }</h2>
				<p className="jetpack-ai-banner__description">{ description }</p>
				{ actions && <div className="jetpack-ai-banner__actions">{ actions }</div> }
			</div>
			<Button
				className="jetpack-ai-banner__close"
				icon={ closeSmall }
				label={ dismissLabel ?? __( 'Dismiss banner', 'jetpack' ) }
				size="small"
				onClick={ onDismiss }
			/>
			<div className="jetpack-ai-banner__orb jetpack-ai-banner__orb--top" />
			<div className="jetpack-ai-banner__orb jetpack-ai-banner__orb--bottom" />
		</div>
	);
}
