import { ExternalLink } from '@wordpress/components';
import clsx from 'clsx';
import styles from './styles.module.scss';

export type HelpCardProps = {
	title: string;
	icon: React.ReactNode;
	headingTag?: `h${ 1 | 2 | 3 | 4 | 5 | 6 }`;
	description?: React.ReactNode;
	link?: string;
	className?: string;
	onClick?: () => void;
};

/**
 * The component for displaying a help card.
 *
 * @param {HelpCardProps} props - The component props.
 * @return The rendered help card component.
 */
export function HelpCard( {
	icon,
	title,
	headingTag: Heading = 'h3',
	description,
	link,
	className,
	onClick,
}: HelpCardProps ) {
	return (
		<section className={ clsx( styles.wrapper, className ) }>
			{ icon ? <div className={ styles.icon }>{ icon }</div> : null }
			<Heading className={ styles.heading }>
				{ link ? (
					<ExternalLink href={ link } onClick={ onClick }>
						{ title }
					</ExternalLink>
				) : (
					title
				) }
			</Heading>
			{ description ? <p className={ styles.description }>{ description }</p> : null }
		</section>
	);
}
