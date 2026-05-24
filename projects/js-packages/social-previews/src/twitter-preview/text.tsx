import { preparePreviewText } from '../helpers';
import { TextProps } from './types';

export const Text: React.FC< TextProps > = ( { text } ) => {
	if ( ! text ) {
		return null;
	}

	return (
		<div className="twitter-preview__text">
			{ preparePreviewText( text, { platform: 'twitter' } ) }
		</div>
	);
};
