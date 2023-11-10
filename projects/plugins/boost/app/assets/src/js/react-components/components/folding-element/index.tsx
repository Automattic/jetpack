import classNames from 'classnames';
import { useState } from 'react';
import styles from './styles.module.scss';

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

			{ expanded && <>{ children }</> }
		</>
	);
};

export default FoldingElement;
