import { Button } from '@wordpress/components';

export default ( { label, onClick } ) => (
	<Button className="components-toolbar__control" label={ label } icon="edit" onClick={ onClick } />
);
