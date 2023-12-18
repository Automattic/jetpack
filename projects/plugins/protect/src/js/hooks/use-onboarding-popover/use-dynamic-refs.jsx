import { useSelect } from '@wordpress/data';
import { useRef, useCallback, useState, useEffect, createRef } from 'react';
import { STORE_ID } from '../../state/store';

const useDynamicRefs = () => {
	const refs = useRef( {} ).current;
	const [ anchors, setAnchors ] = useState( {} );

	const { status } = useSelect( select => ( {
		status: select( STORE_ID ).getStatus(),
	} ) );

	const getRef = useCallback(
		key => {
			if ( ! refs[ key ] ) {
				refs[ key ] = createRef();
			}
			return refs[ key ];
		},
		[ refs ]
	);

	useEffect( () => {
		if ( status.status === 'idle' ) {
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
	}, [ refs, setAnchors, status.status ] );

	return { getRef, anchors };
};

export default useDynamicRefs;
