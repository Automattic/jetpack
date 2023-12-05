import { createInterpolateElement } from '@wordpress/element';
import { type InterpolateVars } from '$lib/utils/interplate-vars-types';
import styles from './numbered-list.module.scss';

type NumberedListTypes = {
	items: string[];
	interpolateVars: InterpolateVars;
};

const NumberedList: React.FC< NumberedListTypes > = ( { items, interpolateVars } ) => {
	return (
		<ol className={ styles[ 'numbered-list' ] }>
			{ items.map( ( item, index ) => (
				<li key={ index }>
					<span className={ styles.index }>{ index + 1 }</span>
					<span className={ styles.text }>
						{ createInterpolateElement( item, interpolateVars ) }
					</span>
				</li>
			) ) }
		</ol>
	);
};

export default NumberedList;
