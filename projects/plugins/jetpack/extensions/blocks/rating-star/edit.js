import {
	AlignmentToolbar,
	BlockControls,
	InspectorControls,
	PanelColorSettings,
} from '@wordpress/block-editor';
import { PanelBody, RangeControl } from '@wordpress/components';
import { __ } from '@wordpress/i18n';
import { range } from 'lodash';

export const Rating = ( { id, setRating, children } ) => {
	const setNewRating = newRating => () => setRating( newRating );
	const maybeSetNewRating = newRating => ( { code } ) =>
		code === 'Enter' ? setRating( newRating ) : null;

	return (
		<span
			className="jetpack-ratings-button"
			tabIndex={ 0 }
			role="button"
			onKeyDown={ maybeSetNewRating( id ) }
			onClick={ setNewRating( id ) }
		>
			{ children }
		</span>
	);
};

export default Symbol =>
	function ( { className, setAttributes, attributes: { align, color, rating, maxRating } } ) {
		const setNewMaxRating = newMaxRating => setAttributes( { maxRating: newMaxRating } );
		const setNewColor = newColor => setAttributes( { color: newColor } );
		const setNewRating = newRating => {
			if ( newRating === rating ) {
				// Same number clicked twice.
				// Check if a half rating.
				if ( Math.ceil( rating ) === rating ) {
					// Whole number.
					newRating = newRating - 0.5;
				}
			} else if ( rating === 0.5 && newRating === 1 ) {
				// Clicking the 0.5 star updates to 0 stars.
				newRating = 0;
			}

			setAttributes( { rating: newRating } );
		};

		return (
			<>
				<BlockControls>
					<AlignmentToolbar
						value={ align }
						onChange={ nextAlign => setAttributes( { align: nextAlign } ) }
					/>
				</BlockControls>
				<div className={ className } style={ { textAlign: align } }>
					{ range( 1, maxRating + 1 ).map( position => (
						<Rating key={ position } id={ position } setRating={ setNewRating }>
							<span>
								<Symbol
									className={ rating >= position - 0.5 ? null : 'is-rating-unfilled' }
									color={ color }
								/>
							</span>
							<span>
								<Symbol
									className={ rating >= position ? null : 'is-rating-unfilled' }
									color={ color }
								/>
							</span>
						</Rating>
					) ) }
				</div>
				<InspectorControls>
					<PanelBody title={ __( 'Settings', 'jetpack' ) }>
						<RangeControl
							label={ __( 'Highest rating', 'jetpack' ) }
							value={ maxRating }
							onChange={ setNewMaxRating }
							min={ 2 }
							max={ 10 }
						/>
						<PanelColorSettings
							title={ __( 'Color Settings', 'jetpack' ) }
							initialOpen
							colorSettings={ [
								{
									value: color,
									onChange: setNewColor,
									label: __( 'Color', 'jetpack' ),
								},
							] }
						/>
					</PanelBody>
				</InspectorControls>
			</>
		);
	};
