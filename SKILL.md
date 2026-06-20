---
name: health-ledger
description: Creates implementation-ready design-system guidance derived from local Figma styles in "HEALTH HUB".
---

<!-- TYPEUI_SH_MANAGED_START -->

# HEALTH HUB

## Mission
Document and operationalize the HEALTH HUB style foundations extracted from Figma so teams can build consistent interfaces quickly.

## Brand
- Product/brand: HEALTH HUB
- Audience: Designers and engineers building this product
- Product surface: web app

## Style Foundations
- Visual style: clean, token-driven, functional
- Typography scale: display-xl, display-lg, heading-lg, heading-md, body-lg, body-md, caption-sm
- Color palette: text-primary #111827, text-secondary #4B5563, bg-primary #FFFFFF, bg-secondary #F9FAFB, accent-primary #2563EB, success #16A34A, warning #D97706, danger #DC2626
- Spacing scale: space-0, space-1, space-2, space-3, space-4, space-6, space-8, space-12
- Radius/shadow/motion tokens: duration-fast 120ms, duration-base 200ms, ease-standard

## Component Families
- buttons
- inputs
- forms
- navigation
- overlays
- feedback
- data display

## Accessibility
- Target: WCAG 2.2 AA
- Keyboard-first interactions required
- Focus-visible rules required
- Contrast constraints required

## Writing Tone
concise, confident, implementation-focused

## Rules: Do
- Use semantic color tokens instead of raw color values.
- Use shared typography styles for headings
- body text
- and labels.
- Define all interaction states for interactive components: default
- hover
- focus-visible
- active
- disabled
- and loading.

## Rules: Don't
- Do not duplicate existing style tokens with one-off naming.
- Do not remove focus-visible indicators or keyboard support.
- Do not hard-code raw values where local styles or variables already exist.

## Guideline Authoring Workflow
1. Restate design intent in one sentence.
2. Define foundations and tokens.
3. Define component anatomy
4. variants
5. and interactions.
6. Add accessibility acceptance criteria.
7. Add anti-patterns and migration notes.
8. End with QA checklist.

## Required Output Structure
- Context and goals
- Design tokens and foundations
- Component-level rules (anatomy, variants, states, responsive behavior)
- Accessibility requirements and testable acceptance criteria
- Content and tone standards with examples
- Anti-patterns and prohibited implementations
- QA checklist

## Component Rule Expectations
- Include keyboard, pointer, and touch behavior.
- Include spacing and typography token requirements.
- Include long-content, overflow, and empty-state handling.

## Quality Gates
- Every non-negotiable rule uses "must".
- Every recommendation uses "should".
- Every accessibility rule is testable in implementation.
- Prefer system consistency over local visual exceptions.

## Acceptance Checklist
- Frontmatter exists with valid `name` and `description`.
- Guidance is under 500 lines for `skill.md` when possible.
- Accessibility and interaction states are explicitly documented.
- Rules are concrete, testable, and non-ambiguous.
- Output can be reused in other repositories with only variable replacement.

## TypeUI + Agentic Integration
This `SKILL.md` is intended for `typeui.sh` CLI workflows.
It can later be integrated with agentic tools including Claude Code, OpenCode, Gemini CLI, Cursor, and similar assistants.

<!-- TYPEUI_SH_MANAGED_END -->
