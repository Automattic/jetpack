import { __ } from '@wordpress/i18n';
import useConnection from '../use-connection';
import './style.scss';
import type { FC } from 'react';

/**
 * Small, clickable pill shown next to a page's title/actions when the site is
 * in local development mode -- a lighter-weight alternative to a full-width
 * notice banner repeated on every page. Links through to the Jetpack
 * dashboard's local development explainer for the full context.
 *
 * Self-contained: reads connection state itself and renders nothing when the
 * site isn't in local development mode, so it can be dropped into any page's
 * `actions` slot unconditionally.
 *
 * @return The badge element, or null when not in local development mode.
 */
const LocalDevModeBadge: FC = () => {
	const { offlineMode } = useConnection();

	if ( ! offlineMode?.isActive ) {
		return null;
	}

	return (
		<a
			href="admin.php?page=jetpack#/dashboard"
			className="jp-connection__local-dev-mode-badge"
			title={ __(
				'This site is in local development mode, so some of what you see here is sample data. Click for details.',
				'jetpack-connection-js'
			) }
		>
			{ __( 'Sample data', 'jetpack-connection-js' ) }
		</a>
	);
};

export default LocalDevModeBadge;
