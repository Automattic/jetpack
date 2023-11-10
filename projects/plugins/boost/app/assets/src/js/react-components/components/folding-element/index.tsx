import { useState } from 'react';

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
		// <button className="components-button is-link foldable-element-control" class:visible onClick={toggle}>
		<>
			<button
				className="components-button is-link foldable-element-control"
				onClick={ () => setExpanded( ! expanded ) }
			>
				{ label }
			</button>

			{ expanded && <>{ children }</> }
		</>
	);
};

export default FoldingElement;
