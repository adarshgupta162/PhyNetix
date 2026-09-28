# Project architecture rules

- Keep the interface theme token-driven in `src/index.css`; this preserves consistent light/dark rendering across student, institute, and admin areas.
- Persist checkout identity details in the existing user-owned `profiles` record; this avoids duplicate personal-data stores and keeps payment prefill consistent.