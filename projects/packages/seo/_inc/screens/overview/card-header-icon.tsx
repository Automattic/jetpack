import { Card } from '@wordpress/ui';
import CardTitleIcon from '../../components/card-title-icon';
import type { ComponentProps, FC } from 'react';

interface Props {
	// The `@wordpress/icons` glyph shown in the leading chip. Taken from the chip
	// itself, so this wrapper can't accept something the chip won't render.
	icon: ComponentProps< typeof CardTitleIcon >[ 'icon' ];
	title: string;
}

/**
 * Overview card header: a title led by an `@wordpress/icons` glyph in a small
 * tinted chip. Shared by the four Overview cards so the chip markup and icon
 * size live in one place rather than being repeated (and drifting) per card.
 *
 * The chip itself comes from the shared `CardTitleIcon`, which the Settings
 * modules also use; this wrapper only adds the `Card.Header`/`Card.Title` shell
 * that the Overview cards need and the Settings modules supply themselves.
 *
 * @param props       - Component props.
 * @param props.icon  - The leading icon glyph.
 * @param props.title - The card title text.
 * @return The card header.
 */
const CardHeaderIcon: FC< Props > = ( { icon, title } ) => (
	<Card.Header>
		{ /* `Card.Title` renders a div by default. These cards sit directly under the
		     page's h1, so they are its second-level headings — without this the
		     Overview has no heading structure to navigate at all. The Settings
		     modules do the same, on their collapsible header. */ }
		<Card.Title render={ <h2 /> }>
			<CardTitleIcon icon={ icon } title={ title } />
		</Card.Title>
	</Card.Header>
);

export default CardHeaderIcon;
