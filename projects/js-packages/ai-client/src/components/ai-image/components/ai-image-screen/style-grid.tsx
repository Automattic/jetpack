/**
 * External dependencies
 */
import { Button } from '@wordpress/components';
import { useState } from '@wordpress/element';
import { __, sprintf } from '@wordpress/i18n';
import clsx from 'clsx';
/**
 * Internal dependencies
 */
import {
	IMAGE_STYLE_AUTO,
	IMAGE_STYLE_NONE,
} from '../../../../hooks/use-image-generator/constants.ts';
import AiIcon from '../../../ai-icon/index.tsx';
import placeholderImage from './assets/realistic.png';
import styles from './styles.module.scss';
/**
 * Types
 */
import type { StyleGridProps } from './types.ts';
import type { ImageStyle } from '../../../../hooks/use-image-generator/constants.ts';

const INITIAL_VISIBLE_COUNT = 4;

/**
 * StyleGrid component - Visual grid of clickable style cards
 *
 * @param props               - Component props
 * @param props.styles
 * @param props.selectedStyle
 * @param props.onSelectStyle
 * @param props.disabled
 * @return The StyleGrid component
 */
export function StyleGrid( {
	styles: imageStyles,
	selectedStyle,
	onSelectStyle,
	disabled = false,
}: StyleGridProps ): JSX.Element | null {
	const [ showAll, setShowAll ] = useState( false );

	// Filter out None and Auto styles - they won't be shown in the grid
	const displayStyles = ( imageStyles || [] ).filter(
		( { value } ) => ! [ IMAGE_STYLE_NONE, IMAGE_STYLE_AUTO ].includes( value )
	);

	const visibleStyles = showAll ? displayStyles : displayStyles.slice( 0, INITIAL_VISIBLE_COUNT );
	const hasMoreStyles = displayStyles.length > INITIAL_VISIBLE_COUNT;

	const handleSelectStyle = ( style: ImageStyle ) => {
		if ( ! disabled ) {
			onSelectStyle( style );
		}
	};

	const toggleShowMore = () => {
		setShowAll( ! showAll );
	};

	return displayStyles.length > 0 ? (
		<div className={ styles[ 'style-grid' ] }>
			{ visibleStyles.map( style => {
				const isSelected = selectedStyle === style.value;
				const isAuto = style.value === IMAGE_STYLE_AUTO;

				return (
					<Button
						key={ style.value }
						className={ clsx( styles.card, {
							[ styles[ 'card-selected' ] ]: isSelected,
						} ) }
						onClick={ () => handleSelectStyle( style.value ) }
						disabled={ disabled }
						aria-pressed={ isSelected }
					>
						<div className={ styles[ 'card-thumbnail' ] }>
							{ isAuto ? (
								<AiIcon size={ 24 } />
							) : (
								<img src={ style.image || placeholderImage } alt={ style.label } />
							) }
						</div>
						<span className={ styles[ 'card-label' ] }>{ style.label }</span>
					</Button>
				);
			} ) }
			{ hasMoreStyles && (
				<Button variant="link" className={ styles[ 'show-more' ] } onClick={ toggleShowMore }>
					{ showAll
						? __( 'Show less', 'jetpack-ai-client' )
						: sprintf(
								/* translators: %d is the number of additional styles available */
								__( 'Show %d more', 'jetpack-ai-client' ),
								displayStyles.length - INITIAL_VISIBLE_COUNT
						  ) }
				</Button>
			) }
		</div>
	) : null;
}
