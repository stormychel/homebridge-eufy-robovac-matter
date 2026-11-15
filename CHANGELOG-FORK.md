# Fork changelog

## 5.1.1

- Fix: the vacuum failed Matter registration ("Behaviors have errors … modeTags: Array length 0 is not within bounds 1 to 8") and never appeared in Apple Home. The Returning Home run mode and Spot Clean clean mode had empty `modeTags`; Matter requires 1 to 8. Returning Home now carries the Mapping tag (16386), Spot Clean the Vacuum tag. (`dist/matter/mappers.js`)
- Package renamed to `@stormychel/homebridge-eufy-robovac-matter`; `PLUGIN_NAME` updated to match.
