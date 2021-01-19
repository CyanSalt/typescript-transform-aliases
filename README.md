# typescript-transform-aliases

Transform aliases in TypeScript files.

## Install

```sh
npm i -D typescript-transform-aliases
// or
yarn add -D typescript-transform-aliases
```

## Usage

With [ttypescript](https://github.com/cevek/ttypescript/) or [ts-patch](https://github.com/nonara/ts-patch)

```json
{
  "compilerOptions": {
    "plugins": [
      {
        "transform": "typescript-transform-aliases",
        "after": true,
        "afterDeclarations": true,
        "aliases": {
          // for example
          "^lodash-es$": "lodash"
        }
      }
    ]
  }
}
```

## Similar packages

- [typescript-transform-paths](https://github.com/LeDDGroup/typescript-transform-paths)

- [@zerollup/ts-transform-paths](https://github.com/zerkalica/zerollup/tree/master/packages/ts-transform-paths/)

- [ts-transform-import-path-rewrite](https://github.com/dropbox/ts-transform-import-path-rewrite)

Both `typescript-transform-paths` and `@zerollup/ts-transform-paths` transform the `paths` field in `tsconfig.json`, which are usually aliases for **relative** paths;

`ts-transform-import-path-rewrite` could transform any aliases but does not support `require` or dynamic imports.
