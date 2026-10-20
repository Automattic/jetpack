import { Card, Icon, Stack } from '@wordpress/ui';
import styles from './style.module.scss';
import type { ComponentProps, FC, ReactNode } from 'react';

export type OverviewSectionProps = {
	icon: ComponentProps< typeof Icon >[ 'icon' ];
	title: string;
	children: ReactNode;
};

/**
 * An Overview section: a question as its heading, and the items that answer it.
 *
 * @param {OverviewSectionProps} props - Component props.
 * @return {import('react').JSX.Element} The section.
 */
const OverviewSection: FC< OverviewSectionProps > = ( { icon, title, children } ) => (
	<Card.Root render={ <section /> }>
		<Card.Header>
			<Stack direction="row" align="center" gap="sm">
				<Icon icon={ icon } size={ 20 } />
				<Card.Title render={ <h3 /> }>{ title }</Card.Title>
			</Stack>
		</Card.Header>
		<Card.Content>
			<div className={ styles.items }>{ children }</div>
		</Card.Content>
	</Card.Root>
);

export default OverviewSection;
