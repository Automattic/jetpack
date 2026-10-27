import { Card, Icon, Stack } from '@wordpress/ui';
import styles from './style.module.scss';
import type { ComponentProps, FC, ReactNode } from 'react';

export type OverviewSectionProps = {
	icon: ComponentProps< typeof Icon >[ 'icon' ];
	title: string;
	headerEnd?: ReactNode;
	children: ReactNode;
};

/**
 * An Overview section: a question as its heading, and the items that answer it.
 *
 * @param {OverviewSectionProps} props - Component props.
 * @return {import('react').JSX.Element} The section.
 */
const OverviewSection: FC< OverviewSectionProps > = ( { icon, title, headerEnd, children } ) => (
	<Card.Root render={ <section /> } className={ styles.section }>
		<Card.Header>
			<Stack
				direction="row"
				align="center"
				justify="space-between"
				gap="sm"
				wrap="wrap"
				className={ styles.heading }
			>
				<Stack direction="row" align="center" gap="sm">
					<Icon icon={ icon } size={ 20 } />
					<Card.Title render={ <h3 /> }>{ title }</Card.Title>
				</Stack>
				{ headerEnd }
			</Stack>
		</Card.Header>
		<div className={ styles.items }>{ children }</div>
	</Card.Root>
);

export default OverviewSection;
