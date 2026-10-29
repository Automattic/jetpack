import { Icon } from '@wordpress/ui';
import styles from './card-title-icon.module.scss';
import type { ComponentProps, FC } from 'react';

interface Props {
	// The `@wordpress/icons` glyph shown before the title.
	icon: ComponentProps< typeof Icon >[ 'icon' ];
	title: string;
}

/**
 * A card title led by a plain `@wordpress/icons` glyph in the title's color.
 *
 * Renders only the inner title span (icon + text), so it drops into any existing
 * `Card.Title` — the collapsible Settings modules wrap their title in a header
 * `Stack` alongside a status indicator, unlike the Overview cards' plain `Card.Header`.
 * Sharing the icon treatment here keeps the Settings modules and Overview cards
 * visually one family from a single source.
 *
 * @param props       - Component props.
 * @param props.icon  - The leading icon glyph.
 * @param props.title - The card title text.
 * @return The icon-led title span.
 */
const CardTitleIcon: FC< Props > = ( { icon, title } ) => (
	<span className={ styles.cardTitle }>
		{ /* 24px is the `size-sm` token. The icon's overhang in `card-title-icon.module.scss` and the
		     Overview subtitle indent use that token, so change them together. */ }
		<Icon icon={ icon } size={ 24 } className={ styles.titleIcon } />
		{ title }
	</span>
);

export default CardTitleIcon;
