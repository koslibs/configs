---
'@koslibs/configs': major
---

Move the Playwright preset and createPlaywrightConfig to @koslibs/playwright. Remove the ./playwright subpath and root Playwright exports; consumers must import the independent browser-testing package.

Allow reusable release workflows to run an optional before-validation-command after dependency installation, so packages can prepare their test environment before lint/type/test validation.
