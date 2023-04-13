/**
 * External dependencies
 */
import { Children, useEffect, useLayoutEffect, useMemo, useRef, useState } from '@wordpress/element';
import classnames from 'classnames';
import { CSSTransition, Transition, TransitionGroup } from 'react-transition-group';

/**
 * Style dependencies
 */
import './style.scss'

const Stack = ( { activeViewKey, className, children } ) => {
	const [ activeView, setActiveView ] = useState( 0 );

	const [ viewHeight, setViewHeight ] = useState( null );

	const [ viewA, setViewA ] = useState( activeViewKey );
	const [ viewAHeight, setViewAHeight ] = useState( 0 );

	const [ viewB, setViewB ] = useState();
	const [ viewBHeight, setViewBHeight ] = useState( 0 );

	const refA = useRef();
	const refB = useRef();

	const keys = useMemo( () => children.map( ( child ) => child.key ), [ children ] );

	useEffect( () => {
		( activeView === 0 ? setViewB : setViewA )( activeViewKey );
		setActiveView( activeView === 0 ? 1 : 0 );
	}, [ activeViewKey, setActiveView, setViewA, setViewB ] );

	useLayoutEffect( () => {
		setViewHeight( refA.current.scrollHeight );
		// const ref = activeView === 0 ? refA : refB;
		// setViewHeight( ref.current.scrollHeight );
	}, [] );

	const resetHeight = () => setViewHeight( null );

	// Positive when view A is 'deeper' than view B.
	// 0 if viewB is undefined (default state before any switching occurs).
	const direction = viewB ? keys.indexOf( viewA ) - keys.indexOf( viewB ) : 0;

	// Also need to know which of the views has more height.
	

	const classes = classnames( 'jp-forms__stack', className );
	const contentClasses = classnames( 'jp-forms__stack-content', {
		'top': direction < 0 ? activeView === 0 : activeView === 1,
		'bottom': direction < 0 ? activeView === 1 : activeView === 0,
	} );

	const style = {
		maxHeight: viewHeight,
	};

	const nodeRef = activeView === 0 ? refA : refB;
	const content = children.find( child => child.key === (activeView === 0 ? viewA : viewB ) );

	const updateHeight = () => nodeRef.current.scrollHeight;

	return (
		<div className={ classes } style={ style }>
			<TransitionGroup component={ null }>
				<CSSTransition
					key={ activeView }
					nodeRef={ nodeRef }
					timeout={2000}
					classNames="stack"
					mountOnEnter
					unmountOnExit
					onEnter={ updateHeight }
					onEntered={ resetHeight }
				>
					<div ref={ nodeRef } className={ contentClasses }>
						{ content }
					</div>
				</CSSTransition>
			</TransitionGroup>
		</div>
	);
};

export default Stack;

const Accordion = ( { children, visible } ) => {
	const [ height, setHeight ] = useState( 0 );
	const content = useRef();

	useLayoutEffect( () => {
		setHeight( content.current.scrollHeight )
	}, [ content.current ] );

	const classes = classNames( 'accordion', {
		'is-visible': visible,
	} );

	const style = {
		maxHeight: `${ visible ? height : 0 }px`,
	};

	// Always render the top most thing

	return (
		<div ref={ content } className={ classes } style={ style } aria-hidden={ ! visible }>
			{ children }
		</div>
	);
};

// export default Accordion;
