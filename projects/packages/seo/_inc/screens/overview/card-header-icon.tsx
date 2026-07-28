import { Card, Icon } from '@wordpress/ui';
import styles from './style.module.scss';
import type { ComponentProps, FC } from 'react';

interface Props {
	// The `@wordpress/icons` glyph shown in the leading chip.
	icon: ComponentProps< typeof Icon >[ 'icon' ];
	title: string;
}

/**
 * Overview card header: a title led by an `@wordpress/icons` glyph in a small
 * tinted chip. Shared by the four Overview cards so the chip markup and icon
 * size live in one place rather than being repeated (and drifting) per card.
 *
 * @param props       - Component props.
 * @param props.icon  - The leading icon glyph.
 * @param props.title - The card title text.
 * @return The card header.
 */
const CardHeaderIcon: FC< Props > = ( { icon, title } ) => (
	<Card.Header>
		<Card.Title>
			<span className={ styles.cardTitle }>
				<span className={ styles.titleIcon }>
					<Icon icon={ icon } size={ 24 } />
				</span>
				{ title }
			</span>
		</Card.Title>
	</Card.Header>
);

export default CardHeaderIcon;
