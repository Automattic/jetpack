import { useParams } from '@wordpress/route';
import { FlowEditor } from '../../src/ui/components/flow-editor';
import '../../src/ui/style.scss';

function EditStage() {
	const params = useParams( { from: '/edit/$flowId' } );
	return <FlowEditor flowId={ Number( params.flowId ) } />;
}

export const stage = EditStage;
