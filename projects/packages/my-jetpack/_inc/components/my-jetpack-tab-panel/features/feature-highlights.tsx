import { Icon, Stack, Text } from '@wordpress/ui';
import styles from './styles.module.scss';
import type { ComponentProps } from 'react';

type IconType = ComponentProps< typeof Icon >[ 'icon' ];

type FeatureHighlightsProps = {
	items: string[];
	icon: IconType;
};

/**
 * A bulleted list of what a tier includes.
 *
 * @param {FeatureHighlightsProps} props       - The component props.
 * @param {string[]}               props.items - The highlights.
 * @param {IconType}               props.icon  - The bullet.
 * @return The rendered component.
 */
export function FeatureHighlights( { items, icon }: FeatureHighlightsProps ) {
	return (
		<Stack direction="column" gap="sm" render={ <ul /> } className={ styles[ 'highlight-list' ] }>
			{ items.map( item => (
				<Stack key={ item } direction="row" align="start" gap="sm" render={ <li /> }>
					<Icon icon={ icon } size={ 20 } className={ styles[ 'inline-icon' ] } />
					<Text variant="body-md">{ item }</Text>
				</Stack>
			) ) }
		</Stack>
	);
}
