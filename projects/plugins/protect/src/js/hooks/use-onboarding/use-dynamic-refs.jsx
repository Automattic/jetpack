import { useConnection } from '@automattic/jetpack-connection';
import { useSelect } from '@wordpress/data';
import { useRef, useCallback, useState, useEffect, createRef } from 'react';
import { STORE_ID } from '../../state/store';

const useDynamicRefs = () => {
	const refs = useRef( {} ).current;
	const [ anchors, setAnchors ] = useState( {} );
	const { isRegistered } = useConnection();

	const { status, selected } = useSelect( select => ( {
		status: select( STORE_ID ).getStatus(),
		selected: select( STORE_ID ).getSelected(),
	} ) );

	const getRef = useCallback( key => {
		if ( ! refs[ key ] ) {
			refs[ key ] = createRef();
		}
		return refs[ key ];
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [] );

	useEffect( () => {
		// Return early if the site is not registered
		if ( ! isRegistered ) {
			return;
		}

		if ( status.status === 'idle' || status.status === 'in_progress' ) {
			const updatedAnchors = Object.keys( refs ).reduce( ( acc, key ) => {
				if ( refs[ key ].current !== null ) {
					acc[ key ] = refs[ key ].current;
				}
				return acc;
			}, {} );

			setAnchors( prevAnchors => ( {
				...prevAnchors,
				...updatedAnchors,
			} ) );
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [ status.status, isRegistered, selected ] );

	return { getRef, anchors };
};

export default useDynamicRefs;
