---
'@koslibs/configs': patch
---

Add the shared koslibs-release CLI for changesets, versioning, publication and portable Git hooks. Provide reusable release, snapshot and PR-check workflows so consumers can keep only project-specific settings.

Create a shared Lefthook template only when no main config exists. Preserve existing configs for manual preset setup and remove the direct js-yaml dependency.
