import useMeasure from 'react-use-measure';
import { animated, useSpring } from '@react-spring/web';
import clsx from 'clsx';
import { useState } from 'react';
import ChevronDown from '$svg/chevron-down';
import ChevronUp from '$svg/chevron-up';
import styles from './folding-element.module.scss';
import { Button } from '@automattic/jetpack-components';

type PropTypes = {
	labelExpandedText: string;
	labelCollapsedText: string;
	isExpanded?: boolean;
	children?: React.ReactNode;
	onExpand?: ( isExpanded: boolean ) => void;
};

const FoldingElement: React.FC< PropTypes > = ( {
	labelExpandedText,
	labelCollapsedText,
	isExpanded = false,
	children = [],
	onExpand,
} ) => {
	const [ expanded, setExpanded ] = useState( isExpanded );
	const label = expanded ? labelCollapsedText : labelExpandedText;

	const [ ref, { height } ] = useMeasure();
	const animationStyles = useSpring( {
		height: expanded ? height : 0,
	} );

	const handleOnExpand = () => {
		const newValue = ! expanded;
		setExpanded( newValue );
		if ( onExpand ) {
			onExpand( newValue );
		}
	};

	return (
		<>
			<Button
				variant="link"
				className={ clsx( styles[ 'foldable-element-control' ], {
					visible: expanded,
				} ) }
				onClick={ handleOnExpand }
			>
				{ label }
				{ expanded ? <ChevronUp /> : <ChevronDown /> }
			</Button>

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
