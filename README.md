# discover-path

[![npm version](https://img.shields.io/npm/v/discover-path.svg?style=flat-square)](https://www.npmjs.com/package/discover-path)[![Build Status](https://img.shields.io/github/workflow/status/rexxars/discover-path/CI/main.svg?style=flat-square)](https://github.com/rexxars/discover-path/actions?query=workflow%3ACI)

Check for the existence of a path in a case-sensitive manner and, if not found, suggest where it might be at.

Note that this is a slow operation (recursively listing directory contents), and should only be used in cases where that's fine (CLI tools in the case of errors, for instance).

## Installing

```sh
$ npm install discover-path
```

## Usage

```js
import {discoverPathSync} from 'discover-path'

const expectedPath = '/Users/Rexxars/webdev/discover-Path'
const actualPath = discoverPathSync(expectedPath)

// If a "direct" match is found (1:1, or on case-changes with only one option:)
console.log(actualPath) // /Users/rexxars/webdev/discover-path
```

- If a 1:1 match can be found (or, if changing the casing of paths, only one option is found), the actual, "fixed" (case-sensitive) path is returned.
- If no direct matches was found, or its unclear which alternative to use, it will throw an error. The error object contains a list of suggestions if any can be found. This array of options can also be found on the `suggestions` property on the error.

```js
import {discoverPathSync} from 'discover-path'

try {
  const expectedPath = '/Users/rexxars/webdev/Discover-Path'
  const actualPath = discoverPathSync(expectedPath)
} catch (err) {
  console.log(err.code) // 'ENOENT'
  console.log(err.path) // '/Users/rexxars/webdev/Discover-Path'
  console.log(err.suggestions)
  /*
  [
    '/Users/rexxars/webdev/discover-path',
    '/Users/rexxars/webdev/discover-Path'
  ]
  */

  console.log(err.message)
  /*
  Cannot find path '/Users/Rexxars/webdev/Discover-Path'

  Did you mean:
    - /Users/rexxars/webdev/discover-path
    - /Users/rexxars/webdev/discover-Path
  */
}
```

## License

MIT © Espen Hovlandsdal
