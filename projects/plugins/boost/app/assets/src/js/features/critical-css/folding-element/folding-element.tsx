import useMeasure from 'react-use-measure';
import { animated, useSpring } from '@react-spring/web';
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

	const [ ref, { height } ] = useMeasure();
	const animationStyles = useSpring( {
		height: expanded ? height : 0,
	} );

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

			<animated.div
				className={ expanded ? styles.expanded : '' }
				style={ {
					overflow: 'hidden',
					...animationStyles,
				} }
			>
				<div ref={ ref } className={ styles[ 'fade-in' ] }>
					{ children }
				</div>
			</animated.div>
		</>
	);
};

export default FoldingElement;
