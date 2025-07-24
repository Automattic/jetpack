# Visx Components Export Module

This module serves as a transparent layer for exporting useful [visx](https://airbnb.io/visx/) components that are commonly needed when building charts and data visualizations. By re-exporting these components, we make visx functionality available to consumers without requiring them to directly depend on or understand the underlying visx library structure.

## Purpose

The main goals of this module are:

1. **Transparency**: Make visx components accessible without exposing the complexity of the visx ecosystem
2. **Selective Export**: Only export small, focused components that provide clear value
3. **Simplified API**: Provide a single entry point for commonly used visx functionality
4. **Abstraction**: Hide visx implementation details from consumers

## What Gets Re-exported

This module focuses on re-exporting:

- **Basic Shapes**: Simple geometric components for building chart elements
- **Types**: TypeScript type definitions that are commonly needed
- **Utility Components**: Small, reusable components that enhance chart functionality

## What Does NOT Get Re-exported

To maintain simplicity and avoid bloat, we do not re-export:

- Complex chart components (these should be built as custom components)
- Large utility libraries
- Specialized/niche functionality
- Components that require deep visx knowledge to use effectively

## Usage

Consumers can import visx components through this module instead of importing directly from visx packages:

```javascript
// Instead of: import { LineShape } from '@visx/legend'
import { LineShape } from '@automattic/charts/visx/legend';

// Instead of: import { Text } from '@visx/text'
import { Text } from '@automattic/charts/visx/text';
```

This approach ensures that consumers get the visx functionality they need while maintaining a clean and manageable dependency structure.
