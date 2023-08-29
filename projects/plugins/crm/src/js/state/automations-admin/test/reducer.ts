import { IdentifiedStep, IdentifiedWorkflow, Workflow } from 'crm/state/automations-admin/types';
import { hydrateWorkflows, activateWorkflow, deactivateWorkflow, setAttribute } from '../actions';
import { workflows, WorkflowState } from '../reducer';
import {
	getWorkflow,
	workflowOne,
	workflowTwo,
	identifiedWorkflowThree,
	getIdentifiedStep,
} from './util/data';

describe( 'Automations Admin Reducer', () => {
	describe( 'workflows', () => {
		describe( 'hydrateWorkflows', () => {
			test( 'creates the state when hydrating empty', () => {
				const inputWorkflows = [ workflowOne, workflowTwo ];

				const action = hydrateWorkflows( inputWorkflows );
				const state = workflows( {}, action );

				expect( Object.keys( state ).map( key => Number( key ) ) ).toEqual( [
					workflowOne.id,
					workflowTwo.id,
				] );
				expect( state[ workflowOne.id ] ).toMatchObject( workflowOne );
				expect( state[ workflowTwo.id ] ).toMatchObject( workflowTwo );
			} );

			test( 'uniquely identifies the workflow steps', () => {
				const inputWorkflows = [ workflowOne, workflowTwo ];

				const action = hydrateWorkflows( inputWorkflows );
				const state = workflows( {}, action );

				const outputWorkflows = Object.values( state );
				expect( outputWorkflows[ 0 ].initial_step.id ).toBeDefined();
				expect( outputWorkflows[ 1 ].initial_step.id ).toBeDefined();
				expect( outputWorkflows[ 0 ].initial_step.id ).not.toEqual(
					outputWorkflows[ 1 ].initial_step.id
				);
			} );

			test( 'replaces the state when hydrating with existing state', () => {
				const inputWorkflows = [ workflowOne, workflowTwo ];
				const initialState = { [ identifiedWorkflowThree.id ]: identifiedWorkflowThree };

				const action = hydrateWorkflows( inputWorkflows );
				const state = workflows( initialState, action );

				expect( Object.keys( state ).map( key => Number( key ) ) ).toEqual( [
					workflowOne.id,
					workflowTwo.id,
				] );
				expect( state[ workflowOne.id ] ).toMatchObject( workflowOne );
				expect( state[ workflowTwo.id ] ).toMatchObject( workflowTwo );
			} );
		} );

		describe( 'activation and deactivation', () => {
			let initialState: WorkflowState;
			let activeWorkflow: Workflow;
			let inactiveWorkflow: Workflow;
			const activeWorkflowId = 1;
			const inactiveWorkflowId = 2;
			const nonExistingWorkflowId = 3;

			beforeEach( () => {
				activeWorkflow = getWorkflow( activeWorkflowId, 'Active Workflow', { active: true } );
				inactiveWorkflow = getWorkflow( inactiveWorkflowId, 'Inactive Workflow', {
					active: false,
				} );
				initialState = workflows( {}, hydrateWorkflows( [ activeWorkflow, inactiveWorkflow ] ) );
			} );

			describe( 'activateWorkflow', () => {
				test( 'activates the selected workflow if it was inactive', () => {
					const action = activateWorkflow( inactiveWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ inactiveWorkflowId ].active ).toBe( true );
				} );

				test( 'leaves the selected workflow active if it was active', () => {
					const action = activateWorkflow( activeWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ activeWorkflowId ].active ).toBe( true );
				} );

				test( 'does not alter the state of an unselected workflow', () => {
					const action = activateWorkflow( activeWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ inactiveWorkflowId ].active ).toBe( false );
				} );

				test( 'does not alter anything if the selected workflow does not exist', () => {
					const action = activateWorkflow( nonExistingWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ activeWorkflowId ].active ).toBe( true );
					expect( newState[ inactiveWorkflowId ].active ).toBe( false );
				} );
			} );

			describe( 'deactivateWorkflow', () => {
				test( 'deactivates the selected workflow if it was active', () => {
					const action = deactivateWorkflow( activeWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ activeWorkflowId ].active ).toBe( false );
				} );

				test( 'leaves the selected workflow inactive if it was inactive', () => {
					const action = deactivateWorkflow( inactiveWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ inactiveWorkflowId ].active ).toBe( false );
				} );

				test( 'does not alter the state of an unselected workflow', () => {
					const action = deactivateWorkflow( inactiveWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ activeWorkflowId ].active ).toBe( true );
				} );

				test( 'does not alter anything if the selected workflow does not exist', () => {
					const action = deactivateWorkflow( nonExistingWorkflowId );
					const newState = workflows( initialState, action );
					expect( newState[ activeWorkflowId ].active ).toBe( true );
					expect( newState[ inactiveWorkflowId ].active ).toBe( false );
				} );
			} );
		} );

		describe( 'setAttribute', () => {
			let initialState: WorkflowState;
			let stepOne: IdentifiedStep;
			let stepTwo: IdentifiedStep;
			let stepThree: IdentifiedStep;
			let workflow: IdentifiedWorkflow;

			const stepOneInitialAttributes = {
				stepOneUnchangedKey: 'stepOneUnchangedValue',
				stepOneChangedKey: 'stepOneChangedValue',
			};
			const stepTwoInitialAttributes = {
				stepTwoUnchangedKey: 'stepTwoUnchangedValue',
				stepTwoChangedKey: 'stepTwoChangedValue',
			};
			const stepThreeInitialAttributes = {
				stepThreeUnchangedKey: 'stepThreeUnchangedValue',
				stepThreeChangedKey: 'stepThreeChangedValue',
			};

			beforeEach( () => {
				stepOne = getIdentifiedStep( 'Step One', 1, {
					attributes: stepOneInitialAttributes,
				} );
				stepTwo = getIdentifiedStep( 'Step Two', 2, {
					attributes: stepTwoInitialAttributes,
				} );
				stepThree = getIdentifiedStep( 'Step Three', 3, {
					attributes: stepThreeInitialAttributes,
				} );
				stepOne.nextStep = stepTwo;
				stepTwo.nextStep = stepThree;
				workflow = getWorkflow( 1, 'Workflow', {
					initial_step: stepOne,
				} ) as IdentifiedWorkflow;
				initialState = {
					[ 1 ]: workflow,
				};
			} );

			test( 'does not alter state if the workflow is not found', () => {
				const action = setAttribute( -1, 1, 'key', 'value' );

				const newState = workflows( initialState, action );

				expect( newState ).toEqual( initialState );
			} );

			test( 'does not alter state if the step is not found', () => {
				const action = setAttribute( 1, -1, 'key', 'value' );

				const newState = workflows( initialState, action );

				expect( newState ).toEqual( initialState );
			} );

			test( 'sets the attributes on the initial step', () => {
				const newAttributeValue = 'newValue';

				const action = setAttribute(
					workflow.id,
					stepOne.id,
					'stepOneChangedKey',
					newAttributeValue
				);
				const newState = workflows( initialState, action );

				expect( newState[ workflow.id ].initial_step.attributes ).toEqual( {
					...stepOneInitialAttributes,
					stepOneChangedKey: newAttributeValue,
				} );
				expect( newState[ workflow.id ].initial_step?.nextStep?.attributes ).toEqual(
					stepTwoInitialAttributes
				);
				expect( newState[ workflow.id ].initial_step?.nextStep?.nextStep?.attributes ).toEqual(
					stepThreeInitialAttributes
				);
			} );

			test( 'sets the attributes on a middle step', () => {
				const newAttributeValue = 'newValue';

				const action = setAttribute(
					workflow.id,
					stepTwo.id,
					'stepTwoChangedKey',
					newAttributeValue
				);
				const newState = workflows( initialState, action );

				expect( newState[ workflow.id ].initial_step.attributes ).toEqual(
					stepOneInitialAttributes
				);
				expect( newState[ workflow.id ].initial_step?.nextStep?.attributes ).toEqual( {
					...stepTwoInitialAttributes,
					stepTwoChangedKey: newAttributeValue,
				} );
				expect( newState[ workflow.id ].initial_step?.nextStep?.nextStep?.attributes ).toEqual(
					stepThreeInitialAttributes
				);
			} );

			test( 'sets the attributes on a final step', () => {
				const newAttributeValue = 'newValue';

				const action = setAttribute(
					workflow.id,
					stepThree.id,
					'stepThreeChangedKey',
					newAttributeValue
				);
				const newState = workflows( initialState, action );

				expect( newState[ workflow.id ].initial_step.attributes ).toEqual(
					stepOneInitialAttributes
				);
				expect( newState[ workflow.id ].initial_step?.nextStep?.attributes ).toEqual(
					stepTwoInitialAttributes
				);
				expect( newState[ workflow.id ].initial_step?.nextStep?.nextStep?.attributes ).toEqual( {
					...stepThreeInitialAttributes,
					stepThreeChangedKey: newAttributeValue,
				} );
			} );
		} );
	} );
} );
