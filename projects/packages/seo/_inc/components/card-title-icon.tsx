import { Icon } from '@wordpress/ui';
import styles from './card-title-icon.module.scss';
import type { ComponentProps, FC } from 'react';

interface Props {
	// The `@wordpress/icons` glyph shown in the leading chip.
	icon: ComponentProps< typeof Icon >[ 'icon' ];
	title: string;
}

/**
 * A card title led by an `@wordpress/icons` glyph in a small tinted chip.
 *
 * Renders only the inner title span (chip + text), so it drops into any existing
 * `Card.Title` — the collapsible Settings modules wrap their title in a header
 * `Stack` alongside a status indicator, unlike the Overview cards' plain `Card.Header`.
 * Sharing the chip here keeps the Settings modules and Overview cards visually
 * one family from a single source.
 *
 * @param props       - Component props.
 * @param props.icon  - The leading icon glyph.
 * @param props.title - The card title text.
 * @return The chip-led title span.
 */
const CardTitleIcon: FC< Props > = ( { icon, title } ) => (
	<span className={ styles.cardTitle }>
		<span className={ styles.titleIcon }>
			<Icon icon={ icon } size={ 24 } />
		</span>
		{ title }
	</span>
);

export default CardTitleIcon;
