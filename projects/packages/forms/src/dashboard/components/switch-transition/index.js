/**
 * External dependencies
 */
import { forwardRef, useCallback, useEffect, useMemo, useRef, useState } from '@wordpress/element';
import { CSSTransition, TransitionGroup } from 'react-transition-group';

/**
 * In order for the transition to work, we need to be able to reference both
 * the old and the current version of the component, which adds some complexity.
 * This component aims to encapsulate that and provide a straight forward interface for switch transtions.
 *
 * @param  {object} props - Props passed down to the wrapper div.
 * @param  {string} props.activeViewKey - Identifier for the currently active view.
 * @param  {Array} props.children - Children.
 * @param  {number} props.duration - Duration of the transition.
 * @param  {object} ref - Reference to the currently active wrapper element.
 * @returns {Element} React element.
 */
const SwitchTransition = ( { activeViewKey, children, duration, ...props }, ref ) => {
	const [ viewKey, setViewKey ] = useState( activeViewKey );
	const [ activeView, setActiveView ] = useState( 0 );

	const refA = useRef();
	const refB = useRef();

	useEffect( () => {
		if ( viewKey === activeViewKey ) {
			return;
		}

		setViewKey( activeViewKey );
		setActiveView( activeView === 0 ? 1 : 0 );
	}, [ activeView, activeViewKey, children, setActiveView, setViewKey, viewKey ] );

	const activeRef = useMemo( () => {
		if ( activeViewKey === viewKey ) {
			return activeView === 0 ? refA : refB;
		}

		return activeView === 0 ? refB : refA;
	}, [ activeView, activeViewKey, viewKey, refA, refB ] );

	const setRefs = useCallback(
		element => {
			if ( ref ) {
				ref.current = element;
			}

			activeRef.current = element;
		},
		[ activeRef, ref ]
	);

	return (
		<TransitionGroup component={ null }>
			<CSSTransition
				key={ activeViewKey }
				nodeRef={ activeRef }
				timeout={ duration }
				mountOnEnter
				unmountOnExit
			>
				<div ref={ setRefs } { ...props }>
					{ children }
				</div>
			</CSSTransition>
		</TransitionGroup>
	);
};

export default forwardRef( SwitchTransition );
