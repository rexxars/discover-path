import {posix, win32} from 'path'
import {MimimalFs, PathNotFoundError} from '../../src/discover-path'

export interface MockFilePath {
  [key: string]: MockFilePath | true
}

export function getMockedFs(entries: MockFilePath): MimimalFs {
  return {readdirSync}

  function readdirSync(target: string): string[] {
    const {join} = getPathImpl(target)
    const paths = getPathSegments(target)

    let subDir
    let parent = entries
    const segments = []

    for (let i = 0; i < paths.length; i++) {
      subDir = paths[i]
      segments.push(subDir)

      const child = parent[subDir]

      if (!child) {
        throw new PathNotFoundError(join(...segments))
      }

      if (child === true) {
        throw new Error(`ENOTDIR: not a directory, scandir '${join(...segments)}'`)
      }

      parent = child
    }

    return Object.keys(parent)
  }
}

function getPathSegments(target: string): string[] {
  const {parse} = getPathImpl(target)
  const {root, dir, base} = parse(target)
  const path = getPathImpl(target)
  if (root === dir + base) {
    return [root]
  }

  const rootless = dir.slice(root.length).split(path.sep).filter(Boolean)
  return base ? [root, ...rootless, base] : [root, ...rootless]
}

function getPathImpl(path: string) {
  return path[0] === '/' ? posix : win32
}
