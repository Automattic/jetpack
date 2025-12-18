import File from './file.tsx';
import './style.scss';

type FileItem = {
	file_id: number;
	name: string;
	url: string;
	size: string;
	type?: string;
	is_previewable?: boolean;
};

type FieldFileProps = {
	files?: FileItem[];
	handleFilePreview: ( file: FileItem ) => () => void;
};

const FieldFile = ( { files, handleFilePreview }: FieldFileProps ) => {
	return (
		<div className="jp-forms__inbox-response-field-file">
			{ files?.length
				? files.map( file => {
						if ( ! file || ! file.name ) {
							return '-';
						}
						return (
							<File file={ file } onClick={ handleFilePreview( file ) } key={ file.file_id } />
						);
				  } )
				: '-' }
		</div>
	);
};

export default FieldFile;
