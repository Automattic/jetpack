/**
 * Internal dependencies
 */
import Story from './story';

export default ( { attributes: { mediaFiles }, className } ) => (
	<Story mountPlayer={ false } className={ className } mediaFiles={ mediaFiles } />
);
