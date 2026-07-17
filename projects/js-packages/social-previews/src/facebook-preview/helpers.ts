import { firstValid, hardTruncation, shortEnough, stripHtmlTags, Formatter } from '../helpers';

const TITLE_LENGTH = 110;
const DESCRIPTION_LENGTH = 200;
export const CUSTOM_TEXT_LENGTH = 63206;

export const facebookTitle: Formatter = text =>
	firstValid(
		shortEnough( TITLE_LENGTH ),
		hardTruncation( TITLE_LENGTH )
	)( stripHtmlTags( text ) ) || '';

export const facebookDescription: Formatter = text =>
	firstValid(
		shortEnough( DESCRIPTION_LENGTH ),
		hardTruncation( DESCRIPTION_LENGTH )
	)( stripHtmlTags( text ) ) || '';
