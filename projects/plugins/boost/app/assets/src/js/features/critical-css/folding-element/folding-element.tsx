import classNames from 'classnames';
import { useState } from 'react';
import styles from './folding-element.module.scss';

type PropTypes = {
	labelExpandedText: string;
	labelCollapsedText: string;
	isExpanded?: boolean;
	children?: React.ReactNode;
};

const FoldingElement: React.FC< PropTypes > = ( {
	labelExpandedText,
	labelCollapsedText,
	isExpanded = false,
	children = [],
} ) => {
	const [ expanded, setExpanded ] = useState( isExpanded );
	const label = expanded ? labelCollapsedText : labelExpandedText;

	return (
		<>
			<button
				className={ classNames( 'components-button is-link', styles[ 'foldable-element-control' ], {
					visible: expanded,
				} ) }
				onClick={ () => setExpanded( ! expanded ) }
			>
				{ label }
			</button>

			{ expanded && <div className={ styles[ 'fade-in' ] }>{ children }</div> }
		</>
	);
};

export default FoldingElement;
