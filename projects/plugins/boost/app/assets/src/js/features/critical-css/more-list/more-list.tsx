import { useState } from 'react';
import { sprintf, __ } from '@wordpress/i18n';
import { FormattedURL } from '../error-description/types';
import styles from './more-list.module.scss';

type MoreListTypes = {
	entries: FormattedURL[];
	showLimit?: number;
};

const MoreList: React.FC< MoreListTypes > = ( { entries = [], showLimit = 2 } ) => {
	const [ expanded, setExpanded ] = useState( false );
	const listItems = expanded ? entries : entries.slice( 0, showLimit );
	const showExpandButton = ! expanded && entries.length > showLimit;

	return (
		<>
			<ul className={ styles[ 'more-list' ] }>
				{ listItems.map( ( { href, label }, index ) => (
					<li key={ index }>
						<a href={ href } target="_blank" rel="noreferrer">
							{ label }
						</a>
					</li>
				) ) }

				{ showExpandButton && (
					<li>
						<a
							onClick={ event => {
								event.preventDefault();
								setExpanded( ! expanded );
							} }
							href="#expand"
						>
							{ sprintf(
								/* translators: %d is the number of items in this list hidden behind this link */
								__( '…and %d more', 'jetpack-boost' ),
								entries.length - showLimit
							) }
						</a>
					</li>
				) }
			</ul>
		</>
	);
};

export default MoreList;
