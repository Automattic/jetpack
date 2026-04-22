# UI Scope Contract for Premium Analytics

This document defines what the current UI layer may assume.

## Current Scope

At present, this package should be treated as an application shell with a minimal
dashboard route.

Agents MUST assume:

- route wiring exists
- page bootstrapping exists
- localization usage exists

Agents MUST NOT assume, unless documented elsewhere in this package:

- a stable analytics REST API exists
- a premium analytics data schema exists
- chart-ready selectors or stores exist
- canonical metric definitions already exist
- retention, aggregation, or segmentation rules already exist

## No Invented Data Layer

Agents MUST NOT invent:

- endpoints
- stores
- selectors
- event models
- metrics
- feature flags

If a change requires data, the agent must first add a documented data contract.

## Required States for Data-Backed UI

If a route introduces data fetching, it MUST explicitly define:

- source of truth
- request lifecycle
- loading state
- empty state
- error state
- retry behavior, if applicable

## Copy and Product Semantics Rule

Agents MUST keep UI copy aligned with implemented functionality.

Agents MUST NOT:

- claim that analytics metrics exist when they do not
- imply premium features are active when not implemented
- describe insights, trends, or reports without backing logic

## Definition of Done for New UI Features

A new UI feature is complete only if:

- the route renders correctly
- all required user-visible states are defined
- text does not overstate backend capability
- any new data dependency is documented in a dedicated contract file
