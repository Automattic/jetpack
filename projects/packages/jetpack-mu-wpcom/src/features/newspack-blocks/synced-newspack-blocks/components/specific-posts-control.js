/**
 * WordPress dependencies
 */
import { __ } from '@wordpress/i18n';
import { useCallback, useRef, useState } from '@wordpress/element';
import {
	Button,
	// eslint-disable-next-line @wordpress/no-unsafe-wp-apis
	__experimentalVStack as VStack,
} from '@wordpress/components';

/**
 * Internal dependencies
 */
import AutocompleteTokenField from './autocomplete-tokenfield';
import ReorderModal from './reorder-modal';
import './specific-posts-control.scss';

const SpecificPostsControl = ( { postIds = [], onChange, fetchSuggestions, fetchSavedInfo } ) => {
	const [ isReordering, setIsReordering ] = useState( false );
	const savedInfo = useRef( { key: null, promise: null } );
	const canReorder = 1 < postIds.length;
	const reorderLabel = __( 'Reorder Content', 'jetpack-mu-wpcom' );

	// The token field and the modal ask for the same titles, so the request is
	// shared rather than made twice, and a failure leaves the slot open to retry.
	const fetchSavedInfoOnce = useCallback(
		ids => {
			const key = [ ...ids ].sort().join( ',' );
			if ( savedInfo.current.key !== key ) {
				savedInfo.current = {
					key,
					promise: fetchSavedInfo( ids ).catch( error => {
						// A late rejection must not evict an entry a newer request owns.
						if ( savedInfo.current.key === key ) {
							savedInfo.current = { key: null, promise: null };
						}
						throw error;
					} ),
				};
			}
			return savedInfo.current.promise;
		},
		[ fetchSavedInfo ]
	);

	return (
        <>
            <VStack spacing={ 2 }>
				<AutocompleteTokenField
					tokens={ postIds }
					onChange={ onChange }
					fetchSuggestions={ fetchSuggestions }
					fetchSavedInfo={ fetchSavedInfoOnce }
					label={ __( 'Content', 'jetpack-mu-wpcom' ) }
					help={ __( 'Begin typing any word in a title. Click on an autocomplete result to select it.', 'jetpack-mu-wpcom' ) }
				/>
				<Button
					className="newspack-blocks-specific-posts-control__reorder"
					variant="secondary"
					__next40pxDefaultSize
					disabled={ ! canReorder }
					accessibleWhenDisabled
					// A button with visible children shows no tooltip unless asked, and
					// only shows one at all when it also carries a label. Matching the
					// label to the visible text leaves the accessible name unchanged.
					label={ reorderLabel }
					showTooltip={ ! canReorder }
					description={ canReorder ? undefined : __('Pick at least two items to reorder them.', 'jetpack-mu-wpcom', 0) }
					onClick={ () => setIsReordering( true ) }
				>
					{ reorderLabel }
				</Button>
			</VStack>
            { isReordering && (
				<ReorderModal
					title={ reorderLabel }
					ids={ postIds }
					fetchItems={ fetchSavedInfoOnce }
					onSave={ ids => {
						onChange( ids );
						setIsReordering( false );
					} }
					onClose={ () => setIsReordering( false ) }
				/>
			) }
        </>
    );
};

export default SpecificPostsControl;
