import clsx from 'clsx';
import type { FunctionComponent } from 'react';

interface Props {
	visible: boolean;
}

const TourKitOverlay: FunctionComponent< Props > = ( { visible } ) => {
	return (
		<div
			className={ clsx( 'tour-kit-overlay', {
				'is-visible': visible,
			} ) }
		/>
	);
};

export default TourKitOverlay;
