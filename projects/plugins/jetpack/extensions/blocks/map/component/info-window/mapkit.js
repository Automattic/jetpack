import { Button, Dashicon, TextareaControl, TextControl } from '@wordpress/components';
import { createPortal, Fragment, useEffect, useState } from '@wordpress/element';
import { __ } from '@wordpress/i18n';
import { useMapkit } from '../../mapkit/hooks';

const InfoWindow = () => {
	const { activeMarker, setActiveMarker, calloutReference, admin, points, setPoints } = useMapkit();
	const [ pointsCopy, setPointsCopy ] = useState( points );
	const [ isDirty, setIsDirty ] = useState( false );
	const { title, caption } = pointsCopy.find( p => p.id === activeMarker?.id ) || {};

	const updateActiveMarker = value => {
		const newPoints = points.map( point => {
			if ( point.id === activeMarker.id ) {
				return { ...point, ...value };
			}
			return point;
		} );
		setPointsCopy( newPoints );
		setIsDirty( true );
	};

	const deleteActiveMarker = () => {
		const newPoints = points.filter( point => point.id !== activeMarker.id );
		setPointsCopy( newPoints );
		setIsDirty( true );
		// force closing of window
		setActiveMarker( null );
	};

	useEffect( () => {
		if ( ! activeMarker && isDirty ) {
			// commit the points when callout is closed, and content is dirty
			setPoints( pointsCopy );
		}
	}, [ activeMarker, isDirty, pointsCopy, setPoints ] );

	useEffect( () => {
		setPointsCopy( points );
		setIsDirty( false );
	}, [ points ] );

	if ( ! activeMarker || ! calloutReference ) {
		return null;
	}

	return createPortal(
		<Fragment>
			{ admin && (
				<Fragment>
					<TextControl
						label={ __( 'Marker Title', 'jetpack' ) }
						value={ title }
						onChange={ value => updateActiveMarker( { title: value } ) }
					/>
					<TextareaControl
						className="wp-block-jetpack-map__marker-caption"
						label={ __( 'Marker Caption', 'jetpack' ) }
						value={ caption }
						rows="2"
						tag="textarea"
						onChange={ value => updateActiveMarker( { caption: value } ) }
					/>
					<Button onClick={ deleteActiveMarker } className="wp-block-jetpack-map__delete-btn">
						<Dashicon icon="trash" size="15" /> { __( 'Delete Marker', 'jetpack' ) }
					</Button>
				</Fragment>
			) }

			{ ! admin && (
				<Fragment>
					<h3>{ title }</h3>
					<p>{ caption }</p>
				</Fragment>
			) }
		</Fragment>,
		calloutReference
	);
};

export default InfoWindow;
