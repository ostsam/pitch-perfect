Original request / feature  
- Fix eslint react-hooks/set-state-in-effect warning in `components/orb.tsx`.

Challenges  
- Lint rule disallows synchronous setState in effects; needed to keep animation behavior without extra renders.

Successes  
- Reworked effect to only run randomizer when active and no external volume prop; derived display volume to avoid synchronous updates.

Methods that did/didn’t work  
- Did: derived `displayVolume` and scoped interval effect to simulation case.  
- Not needed: additional cleanup hooks or refactoring animations.

Changes made to the codebase (≤50 lines)  
- `components/orb.tsx`: effect now exits when inactive or volume prop exists; added `displayVolume` and swapped animation inputs to use it.

