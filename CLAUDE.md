# CLAUDE.md

This file provides guidance to Claude Code when working with code in this repository.

## Search Guidelines

### Required Search Behavior
- Use ripgrep (rg) for text searches instead of grep or Glob
- Use fd instead of find for file finding
- Respects .gitignore automatically - no need to exclude node_modules

### Example Commands
- Text search: `rg "pattern" --type js`
- File search: `fd app.js"`