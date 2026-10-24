---
'@koslibs/configs': major
---

Replace the vulnerable happy-dom dependency with jsdom 29.1.1 and use jsdom as the
React Rstest preset's default DOM environment. This removes GHSA-834v-8h66-3h79
without violating Rstest's peer dependency requirements or raising the minimum
Node version.

The preset factories and exports are unchanged. Consumers using window.happyDOM,
an explicit happy-dom environment or Happy DOM-specific options must migrate to
jsdom. See the Rstest preset documentation for the new environment options.
