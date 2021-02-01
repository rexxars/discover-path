import {posix, win32} from 'path'
import nodeFs from 'fs'

export function discoverPathSync(target: string, options: DiscoverOptions = {}): string {
  const {readdirSync} = options.fs || nodeFs
  const {join} = getPathImpl(target)
  const paths = getPathSegments(target)

  let path
  let content
  let current
  const matchingSegments: string[] = [paths[0]]
  for (let i = 1; i < paths.length; i++) {
    path = join(...paths.slice(0, i))
    current = paths[i]
    content = readdirSync(path)

    // Direct match! (foo.jpg => foo.jpg)
    if (content.includes(current)) {
      matchingSegments.push(current)
      continue
    }

    // Case-insensitive match?
    const matches = getCaseInsensitiveMatches(current, content)

    // No matches?
    if (matches.length === 0) {
      throw new PathNotFoundError(target)
    }

    // One match? Auto-correct! (Foo.jpg => foo.jpg)
    if (matches.length === 1) {
      paths[i] = matches[0]
      matchingSegments.push(matches[0])
      continue
    }

    // More than one match? (Foo.jpg, foo.jpg, fOo.jpg)
    const head = matchingSegments.slice(0, i)
    const tail = paths.slice(i)
    const suggestions = tail.length === 1 ? matches.map((match) => join(...head, match)) : []
    throw new PathNotFoundError(target, suggestions)
  }

  return join(...matchingSegments)
}

function getCaseInsensitiveMatches(target: string, content: string[]): string[] {
  const lowercased = target.toLowerCase()
  const length = Math.min(content.length, 2)
  const matches = []
  for (let i = 0; i < length; i++) {
    if (lowercased === content[i].toLowerCase()) {
      matches.push(content[i])
    }
  }
  return matches
}

function getPathSegments(target: string): string[] {
  const {parse} = getPathImpl(target)
  const {root, dir, base} = parse(target)
  const path = getPathImpl(target)
  if (root === dir + base) {
    return [root]
  }

  const rootless = dir.slice(root.length).split(path.sep).filter(Boolean)
  return [root, ...rootless, base]
}

function getPathImpl(path: string) {
  return path[0] === '/' ? posix : win32
}

export interface MimimalFs {
  readdirSync(dir: string): string[]
}

export interface DiscoverOptions {
  fs?: MimimalFs
}

export class PathNotFoundError extends Error {
  path: string
  suggestions: string[]
  errno = -2
  code = 'ENOENT'
  syscall = 'scandir'

  constructor(missingPath: string, suggestions: string[] = []) {
    super(`ENOENT: no such file or directory, scandir '${missingPath}'`)

    this.path = missingPath
    this.suggestions = suggestions
    this.message +=
      suggestions.length === 0
        ? ''
        : `\nDid you mean:\n${suggestions.map((item) => `  - ${item}`).join('\n')}`
  }
}
