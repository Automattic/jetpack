/**
 * External dependencies
 */
import { Children, cloneElement, useEffect, useRef, useState } from '@wordpress/element';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

/**
 * In order for the transition to work, we need to be able to reference both
 * the old and the current version of the component, which adds some complexity.
 * This component aims to encapsulate that and provide a straight forward interface for switch transtions.
 *
 * @param  {object}    props -  Props passed down to the wrapper div.
 * @param  {string} props.activeViewKey -  Identifier for the currently active view.
 * @param  {Children}    props.children     -  Children.
 * @param  {number} props.duration - Duration of the transition.
 * @returns {Element} React element.
 */
const SwitchTransition = ( { activeViewKey, children, duration, ...props } ) => {
	const [ viewKey, setViewKey ] = useState( activeViewKey );
	const [ content, setContent ] = useState(
		Children.map( children, child => cloneElement( child ) )
	);
	const [ activeView, setActiveView ] = useState( 0 );

	const refA = useRef();
	const refB = useRef();

	useEffect( () => {
		if ( viewKey === activeViewKey ) {
			return;
		}

		setViewKey( activeViewKey );
		setContent( Children.map( children, child => cloneElement( child ) ) );
		setActiveView( activeView === 0 ? 1 : 0 );
	}, [ activeView, activeViewKey, children, setActiveView, setViewKey, viewKey ] );

	const nodeRef = activeView === 0 ? refA : refB;

	return (
		<TransitionGroup component={ null }>
			<CSSTransition
				key={ viewKey }
				nodeRef={ nodeRef }
				timeout={ duration }
				mountOnEnter
				unmountOnExit
			>
				<div ref={ nodeRef } { ...props }>
					{ activeViewKey !== viewKey ? content : children }
				</div>
			</CSSTransition>
		</TransitionGroup>
	);
};

export default SwitchTransition;
