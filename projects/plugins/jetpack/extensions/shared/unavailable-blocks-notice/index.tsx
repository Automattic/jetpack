import { createHigherOrderComponent } from '@wordpress/compose';
import { addFilter } from '@wordpress/hooks';
import getUnavailableCause from './get-unavailable-cause';
import UnavailableBlockEdit from './unavailable-block-edit';
import type { UnavailableBlocksData } from './get-unavailable-cause';

/**
 * Replace core's missing-block warning on Jetpack blocks whose absence Jetpack can explain.
 *
 * @param {UnavailableBlocksData} [data] - What the server knows about unavailable blocks.
 */
export default function registerUnavailableBlocksNotice( data?: UnavailableBlocksData ) {
	if ( ! data ) {
		return;
	}

	const withUnavailableBlockNotice = createHigherOrderComponent( BlockEdit => {
		return props => {
			// Runs for every block on every render: keep the common path to one comparison.
			if ( props.name !== 'core/missing' ) {
				return <BlockEdit { ...props } />;
			}

			const cause = getUnavailableCause( props.attributes?.originalName, data );
			if ( ! cause ) {
				return <BlockEdit { ...props } />;
			}

			return (
				<UnavailableBlockEdit
					attributes={ props.attributes }
					clientId={ props.clientId }
					cause={ cause }
					data={ data }
				/>
			);
		};
	}, 'withUnavailableBlockNotice' );

	addFilter( 'editor.BlockEdit', 'jetpack/unavailable-blocks-notice', withUnavailableBlockNotice );
}
