#!/usr/bin/env node

import { spawnSync } from 'node:child_process';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
	CallToolRequestSchema,
	ListToolsRequestSchema,
	ToolSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { z } from 'zod';
import { zodToJsonSchema } from 'zod-to-json-schema';

// Command line argument parsign
const input_args = process.argv.slice( 2 );
if ( input_args.length === 0 ) {
	throw new Erorr( 'Usage: mcp-server-monorepo project_name' );
}

type ToolInput = z.infer< typeof ToolSchema.shape.inputSchema >;

// Server setup
const server = new Server(
	{
		name: 'monorepo-server',
		version: '0.0.',
	},
	{
		capabilities: {
			tools: {},
		},
	}
);

// Tool handlers
server.setRequestHandler( ListToolsRequestSchema, async () => {
	return {
		tools: [
			{
				name: 'run_static_analysis',
				description: 'Runs Phan static analysis tool over a project',
				inputSchema: zodToJsonSchema( RunStaticAnalysis ) as ToolInput,
			},
		],
	};
} );

server.setRequestHandler( CallToolRequestSchema, async request => {
	try {
		const { name } = request.params;

		switch ( name ) {
			case 'run_static_analysis': {
				const data = spawnSync( 'jetpack', [ 'phan', '-v', ...input_args ], {
					cwd: process.cwd(),
					env: process.env,
					stdio: [ process.stdin, process.stdout, process.stderr ],
				} );
				return {
					content: [ { type: 'text', text: 'Command called successfully!' + data } ],
				};
			}

			default:
				throw new Error( `Unknown tool: ${ name }` );
		}
	} catch ( error ) {
		const errorMessage = error instanceof Error ? error.message : String( error );
		return {
			content: [ { type: 'text', text: `Error: ${ errorMessage }` } ],
			isError: true,
		};
	}
} );

/**
 * Start server.
 */
async function runServer() {
	const transport = new StdioServerTransport();
	await server.connect( transport );
}

runServer().catch( error => {
	throw new Error( 'Fatal error running server:', error );
} );
