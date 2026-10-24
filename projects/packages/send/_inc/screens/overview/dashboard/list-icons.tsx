import { cog, comment, envelope, lock, people, wordpress } from '@wordpress/icons';
import { Icon } from '@wordpress/ui';
import Avatar, { useImage } from '../../../components/avatar';
import type { ComponentProps } from 'react';
// The Log renders these icons too, so they load their own styles.
import './dashboard.scss';

type IconShape = ComponentProps< typeof Icon >[ 'icon' ];

const CORE_ICONS: Record< string, IconShape > = {
	'core:password_reset': lock,
	'core:new_user': people,
	'core:comment': comment,
	'core:admin': cog,
	core: wordpress,
	other: envelope,
};

/**
 * The glyph for a kind of WordPress email, or null for plugins and themes, which show their initial.
 *
 * @param key - Origin key, like `core:password_reset`, `theme:twentytwentyfive` or `plugin:shop`.
 * @return The icon, or null.
 */
export function originFallbackIcon( key: string ): IconShape | null {
	return CORE_ICONS[ key ] ?? null;
}

type OriginIconProps = {
	originKey: string;
	/** The plugin or theme's name, for its initial. */
	label: string;
	/** The plugin's icon from WordPress.org, or null. */
	url?: string | null;
};

/**
 * The plugin's own icon beside a "What sends the most" row, else a glyph for WordPress's own
 * emails or the name's initial. Decorative: the name next to it is the label.
 *
 * @param props           - Component props.
 * @param props.originKey - Origin key.
 * @param props.label     - The origin's name.
 * @param props.url       - Icon URL, or null.
 * @return The icon.
 */
export const OriginIcon = ( { originKey, label, url }: OriginIconProps ) => {
	const image = useImage( url );
	const glyph = originFallbackIcon( originKey );
	if ( ! image.show ) {
		return glyph ? (
			<span aria-hidden="true" className="jetpack-send-origin-icon jetpack-send-origin-icon--glyph">
				<Icon icon={ glyph } />
			</span>
		) : (
			<Avatar name={ label } />
		);
	}
	return (
		<span aria-hidden="true" className="jetpack-send-origin-icon">
			<img src={ url ?? '' } alt="" onError={ image.onError } />
		</span>
	);
};
