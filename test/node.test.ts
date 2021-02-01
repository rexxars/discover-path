import {join, parse} from 'path'
import {discoverPathSync, PathNotFoundError} from '../src/discover-path'
import {getMockedFs} from './util/mockedFs'

describe('actual fs', () => {
  const fixturesPath = join(__dirname, 'fixtures')

  test('returns path verbatim on direct, case-sensitive match (file)', () => {
    const path = join(fixturesPath, 'foo', 'bAr', 'baz.txt')
    expect(discoverPathSync(path)).toEqual(path)
    expect(discoverPathSync(path, {})).toEqual(path)
  })

  test('returns path case-corrected on case-insensitive match (file)', () => {
    const path = join(fixturesPath, 'Foo', 'bar', 'Baz.txt')
    expect(discoverPathSync(path)).toEqual(join(fixturesPath, 'foo', 'bAr', 'baz.txt'))
    expect(discoverPathSync(path, {})).toEqual(join(fixturesPath, 'foo', 'bAr', 'baz.txt'))
  })

  test('returns path verbatim on direct, case-sensitive match (dir)', () => {
    const path = join(fixturesPath, 'foo', 'bAr')
    expect(discoverPathSync(path)).toEqual(path)
    expect(discoverPathSync(path, {})).toEqual(path)
  })

  test('returns path case-corrected on case-insensitive match (dir)', () => {
    const path = join(fixturesPath, 'Foo', 'bar')
    expect(discoverPathSync(path)).toEqual(join(fixturesPath, 'foo', 'bAr'))
    expect(discoverPathSync(path, {})).toEqual(join(fixturesPath, 'foo', 'bAr'))
  })

  test('returns path on root-lookup', () => {
    const {root} = parse(__dirname)
    expect(discoverPathSync(root)).toEqual(root)
    expect(discoverPathSync(root, {})).toEqual(root)
  })

  test('returns path on root-lookup', () => {
    const {root} = parse(__dirname)
    expect(discoverPathSync(root)).toEqual(root)
    expect(discoverPathSync(root, {})).toEqual(root)
  })

  test('throws on treating file as directory', () => {
    const path = join(fixturesPath, 'foo', 'bAr', 'baz.txt', 'yeah')
    expect(() => discoverPathSync(path)).toThrowError(/not a directory/)
    expect(() => discoverPathSync(path, {})).toThrowError(/not a directory/)
  })

  test('throws on no possible matches', () => {
    const path = join(fixturesPath, 'nein')
    expect(() => discoverPathSync(path)).toThrowError(/no such file or directory/)
    expect(() => discoverPathSync(path, {})).toThrowError(/no such file or directory/)
  })
})

describe('mocked posix', () => {
  test('returns path verbatim on direct, case-sensitive match (file)', () => {
    const path = '/foo/bar/baz.jpg'
    const fs = getMockedFs({'/': {foo: {bar: {'baz.jpg': true}}}})
    expect(discoverPathSync(path, {fs})).toEqual(path)
  })

  test('returns path case-corrected on case-insensitive match (file)', () => {
    const path = '/Foo/bar/Baz.jpg'
    const fs = getMockedFs({'/': {foo: {bar: {'baz.jpg': true}}}})
    expect(discoverPathSync(path, {fs})).toEqual('/foo/bar/baz.jpg')
  })

  test('returns path verbatim on direct, case-sensitive match (dir)', () => {
    const path = '/foo/bar'
    const fs = getMockedFs({'/': {foo: {bar: {'baz.jpg': true}}}})
    expect(discoverPathSync(path, {fs})).toEqual(path)
  })

  test('returns path case-corrected on case-insensitive match (dir)', () => {
    const path = '/Foo/bar'
    const fs = getMockedFs({'/': {foo: {bar: {'baz.jpg': true}}}})
    expect(discoverPathSync(path, {fs})).toEqual('/foo/bar')
  })

  test('returns path on root-lookup', () => {
    const fs = getMockedFs({'/': {foo: {}}})
    expect(discoverPathSync('/', {fs})).toEqual('/')
  })

  test('throws on treating file as directory', () => {
    const path = '/foo/bar/baz.jpg'
    const fs = getMockedFs({'/': {foo: true}})
    expect(() => discoverPathSync(path, {fs})).toThrowError(/not a directory/)
  })

  test('throws on no possible matches', () => {
    const path = '/foo/bar/baz.jpg'
    const fs = getMockedFs({'/': {foo: {}}})
    expect(() => discoverPathSync(path, {fs})).toThrowError(/no such file or directory/)
  })

  test('throw error with suggestions property on possible matches', () => {
    const path = '/foo/bar/baz'
    const fs = getMockedFs({'/': {foo: {bAr: {bAz: true, BAZ: true}}}})
    let error
    try {
      discoverPathSync(path, {fs})
    } catch (err) {
      error = err
    }

    expect(error).toBeInstanceOf(PathNotFoundError)
    expect(error.message).toMatchSnapshot()
    expect(error.suggestions).toEqual(['/foo/bAr/bAz', '/foo/bAr/BAZ'])
  })

  test('throws on no relevant matches', () => {
    const path = '/foo/bar/baz.jpg'
    const fs = getMockedFs({'/': {foo: {bap: true, folder: {}}}})
    expect(() => discoverPathSync(path, {fs})).toThrowError(/no such file or directory/)
  })

  test('throws on multiple matching paths (middle)', () => {
    const path = '/foo/bar/baz.jpg'
    const fs = getMockedFs({'/': {foo: {bAr: {'baz.jpg': true}, Bar: {'baz.jpg': true}}}})
    expect(() => discoverPathSync(path, {fs})).toThrowError(/no such file or directory/)
  })

  test('throws on multiple matching paths (end)', () => {
    const path = '/Users/rexxars/webdev/Discover-Path'
    const fs = getMockedFs({
      '/': {
        Users: {
          rexxars: {
            webdev: {
              'discover-path': {yep: true},
              'discover-Path': {yep: true},
            },
          },
        },
      },
    })
    expect(() => discoverPathSync(path, {fs})).toThrowErrorMatchingSnapshot()
  })
})

describe('mocked win32', () => {
  test('returns path verbatim on direct, case-sensitive match (file)', () => {
    const path = 'C:\\foo\\bar\\baz.jpg'
    const fs = getMockedFs({'C:\\': {foo: {bar: {'baz.jpg': true}}}})
    expect(discoverPathSync(path, {fs})).toEqual(path)
  })

  test('returns path case-corrected on case-insensitive match (file)', () => {
    const path = 'C:\\Foo\\bar\\Baz.jpg'
    const fs = getMockedFs({'C:\\': {foo: {bar: {'baz.jpg': true}}}})
    expect(discoverPathSync(path, {fs})).toEqual('C:\\foo\\bar\\baz.jpg')
  })

  test('returns path verbatim on direct, case-sensitive match (dir)', () => {
    const path = 'C:\\foo\\bar'
    const fs = getMockedFs({'C:\\': {foo: {bar: {'baz.jpg': true}}}})
    expect(discoverPathSync(path, {fs})).toEqual(path)
  })

  test('returns path case-corrected on case-insensitive match (dir)', () => {
    const path = 'C:\\Foo\\bar'
    const fs = getMockedFs({'C:\\': {foo: {bar: {'baz.jpg': true}}}})
    expect(discoverPathSync(path, {fs})).toEqual('C:\\foo\\bar')
  })

  test('returns path on root-lookup', () => {
    const fs = getMockedFs({'C:\\': {foo: {}}})
    expect(discoverPathSync('C:\\', {fs})).toEqual('C:\\')
  })

  test('throws on treating file as directory', () => {
    const path = 'C:\\foo\\bar\\baz.jpg'
    const fs = getMockedFs({'C:\\': {foo: true}})
    expect(() => discoverPathSync(path, {fs})).toThrowError(/not a directory/)
  })

  test('throws on no possible matches', () => {
    const path = 'C:\\foo\\bar\\baz.jpg'
    const fs = getMockedFs({'C:\\': {foo: {}}})
    expect(() => discoverPathSync(path, {fs})).toThrowError(/no such file or directory/)
  })

  test('throw error with suggestions property on possible matches', () => {
    const path = 'C:\\foo\\bar\\baz'
    const fs = getMockedFs({'C:\\': {foo: {bAr: {bAz: true, BAZ: true}}}})
    let error
    try {
      discoverPathSync(path, {fs})
    } catch (err) {
      error = err
    }

    expect(error).toBeInstanceOf(PathNotFoundError)
    expect(error.message).toMatchSnapshot()
    expect(error.suggestions).toEqual(['C:\\foo\\bAr\\bAz', 'C:\\foo\\bAr\\BAZ'])
  })

  test('throws on no relevant matches', () => {
    const path = 'C:\\foo\\bar\\baz.jpg'
    const fs = getMockedFs({'C:\\': {foo: {bap: true, folder: {}}}})
    expect(() => discoverPathSync(path, {fs})).toThrowError(/no such file or directory/)
  })

  test('throws on multiple matching paths (middle)', () => {
    const path = 'C:\\foo\\bar\\baz.jpg'
    const fs = getMockedFs({'C:\\': {foo: {bAr: {'baz.jpg': true}, Bar: {'baz.jpg': true}}}})
    expect(() => discoverPathSync(path, {fs})).toThrowError(/no such file or directory/)
  })

  test('throws on multiple matching paths (end)', () => {
    const path = 'C:\\Users\\rexxars\\webdev/Discover-Path'
    const fs = getMockedFs({
      '/': {
        Users: {
          rexxars: {
            webdev: {
              'discover-path': {yep: true},
              'discover-Path': {yep: true},
            },
          },
        },
      },
    })
    expect(() => discoverPathSync(path, {fs})).toThrowErrorMatchingSnapshot()
  })
})
