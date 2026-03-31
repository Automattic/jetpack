import { evaluationResultSchema } from '../src/schema';

const validResult = {
	version: 1 as const,
	score: 72,
	grade: 'B' as const,
	files_found: [ 'CLAUDE.md', 'AGENTS.md' ],
	criteria: {
		commands_workflows: { score: 16, max: 20, notes: 'Good coverage' },
		architecture_clarity: { score: 14, max: 20, notes: 'Decent' },
		non_obvious_patterns: { score: 12, max: 15, notes: 'Some gaps' },
		conciseness: { score: 11, max: 15, notes: 'Mostly concise' },
		currency: { score: 10, max: 15, notes: 'Some stale refs' },
		actionability: { score: 9, max: 15, notes: 'Needs more examples' },
	},
	issues: [ 'Missing deploy docs' ],
	recommendations: [ 'Add deployment workflow' ],
};

describe( 'evaluationResultSchema', () => {
	test( 'accepts valid evaluation result', () => {
		const parsed = evaluationResultSchema.parse( validResult );
		expect( parsed.score ).toBe( 72 );
		expect( parsed.grade ).toBe( 'B' );
	} );

	test( 'requires all six criteria', () => {
		const incomplete = { ...validResult, criteria: {} };
		expect( () => evaluationResultSchema.parse( incomplete ) ).toThrow();
	} );

	test( 'rejects score above 100', () => {
		const bad = { ...validResult, score: 101 };
		expect( () => evaluationResultSchema.parse( bad ) ).toThrow();
	} );

	test( 'rejects invalid grade', () => {
		const bad = { ...validResult, grade: 'X' };
		expect( () => evaluationResultSchema.parse( bad ) ).toThrow();
	} );

	test( 'requires version 1', () => {
		const bad = { ...validResult, version: 2 };
		expect( () => evaluationResultSchema.parse( bad ) ).toThrow();
	} );
} );
