import {
	Button,
	__experimentalVStack as VStack, // eslint-disable-line @wordpress/no-unsafe-wp-apis
} from '@wordpress/components';
import { image as imageIcon } from '@wordpress/icons';
import photon from 'photon';
import './style.scss';

const FieldImageSelect = ( { choices, handleFilePreview } ) => {
	return (
		<div className="jp-forms__inbox-response-image-select">
			{ ( choices?.length ?? 0 ) === 0 && '-' }
			{ ( choices?.length ?? 0 ) > 0 && (
				<VStack spacing="1">
					{ choices.map( choice => {
						const label = choice.label
							? `${ choice.selected }: ${ choice.label }`
							: choice.selected;
						const hasImage = choice.image?.src;
						return (
							<Button
								__next40pxDefaultSize
								key={ choice.selected }
								variant="tertiary"
								onClick={
									hasImage
										? handleFilePreview( {
												file_id: choice.image.id,
												name: label,
												url: choice.image.src,
										  } )
										: undefined
								}
								className="image-select-field-button"
								icon={
									hasImage ? (
										<img
											alt={ choice.selected }
											className="image-select-field-image"
											loading="lazy"
											src={ photon( choice.image.src, { width: 120, height: 120 } ) }
										/>
									) : (
										imageIcon
									)
								}
								iconSize={ 60 }
							>
								{ label }
							</Button>
						);
					} ) }
				</VStack>
			) }
		</div>
	);
};

export default FieldImageSelect;
