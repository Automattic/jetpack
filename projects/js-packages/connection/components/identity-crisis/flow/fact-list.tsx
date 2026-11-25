import { Text } from '@wordpress/ui';
import styles from '../styles.module.scss';
import { getFactsLabel } from './copy';
import type { FactLine } from './copy';
import type { ReactNode } from 'react';

/**
 * "What we already know": what the screen can tell about the site.
 *
 * @param {object}     props       - Component props.
 * @param {FactLine[]} props.facts - The lines.
 * @return {ReactNode} The list, or nothing without facts.
 */
export default function FactList( { facts }: { facts: FactLine[] } ): ReactNode {
	if ( facts.length === 0 ) {
		return null;
	}
	return (
		<ul className={ styles.facts } aria-label={ getFactsLabel() }>
			{ facts.map( fact => (
				<Text key={ fact.key } variant="body-sm" render={ <li /> }>
					{ fact.text }
				</Text>
			) ) }
		</ul>
	);
}
