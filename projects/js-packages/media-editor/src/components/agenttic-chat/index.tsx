/**
 * Agenttic Chat Integration for Media Editor
 *
 * This module provides AI-powered chat functionality for image editing,
 * integrating the agenttic client and UI components with the WordPress media editor.
 */

export { default as AgentticChatProvider } from './provider';
export { default as MediaEditorContextProvider } from './context';
export { default as FloatingChat } from './floating-chat';
export { default as ImageEditingTools } from './tools';
export { default as AuthProvider } from './auth';

// Import agenttic-ui styles
import '@automattic/agenttic-ui/index.css';
