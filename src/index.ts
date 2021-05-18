import ts from 'typescript'

interface TransformAliasesOptions {
  aliases: Record<string, string>
}

function transformAliases(program: ts.Program, options: TransformAliasesOptions) {

  const replacers = Object.entries(options.aliases).map(([key, value]) => ({
    pattern: new RegExp(key),
    replacement: value,
  }))

  function replaceAliases(importPath: string, factory: ts.NodeFactory) {
    let replacedPath = importPath
    for (const replacer of replacers) {
      replacedPath = replacedPath.replace(replacer.pattern, replacer.replacement)
    }
    return replacedPath !== importPath
      ? factory.createStringLiteral(replacedPath)
      : null
  }

  function transformerFactory(context: ts.TransformationContext) {

    const { factory } = context

    function visitor(node: ts.Node) {
      // require('foo')
      // import('foo')
      if (
        ts.isCallExpression(node)
          && node.arguments.length === 1
          && ts.isStringLiteral(node.arguments[0])
          && (
            node.expression.kind === ts.SyntaxKind.ImportKeyword
              || (ts.isIdentifier(node.expression) && node.expression.text === 'require')
          )
      ) {
        const importPath = (node.arguments[0] as ts.StringLiteral).text
        const replacedPath = replaceAliases(importPath, factory)
        if (replacedPath) {
          return factory.updateCallExpression(node, node.expression, node.typeArguments, [replacedPath])
        }
      }
      // import foo = require('foo')
      if (ts.isExternalModuleReference(node) && ts.isStringLiteral(node.expression)) {
        const importPath = node.expression.text
        const replacedPath = replaceAliases(importPath, factory)
        if (replacedPath) {
          return factory.updateExternalModuleReference(node, replacedPath)
        }
      }
      // typeof import('foo')
      if (
        ts.isImportTypeNode(node)
          && ts.isLiteralTypeNode(node.argument)
          && ts.isStringLiteral(node.argument.literal)
          && node.argument.literal.text
      ) {
        const importPath = node.argument.literal.text
        const replacedPath = replaceAliases(importPath, factory)
        if (replacedPath) {
          return factory.updateImportTypeNode(
            node,
            factory.updateLiteralTypeNode(node.argument, replacedPath),
            node.qualifier,
            node.typeArguments,
            node.isTypeOf,
          )
        }
      }
      // import 'foo'
      if (
        ts.isImportDeclaration(node)
          && node.moduleSpecifier
          && ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const importPath = node.moduleSpecifier.text
        const replacedPath = replaceAliases(importPath, factory)
        if (replacedPath) {
          return factory.updateImportDeclaration(
            node,
            node.decorators,
            node.modifiers,
            node.importClause,
            replacedPath,
          )
        }
      }
      // export * from 'foo'
      if (
        ts.isExportDeclaration(node)
          && node.moduleSpecifier
          && ts.isStringLiteral(node.moduleSpecifier)
      ) {
        const importPath = node.moduleSpecifier.text
        const replacedPath = replaceAliases(importPath, factory)
        if (replacedPath) {
          return factory.updateExportDeclaration(
            node,
            node.decorators,
            node.modifiers,
            node.isTypeOnly,
            node.exportClause,
            replacedPath,
          )
        }
      }
      // declare module 'foo'
      if (ts.isModuleDeclaration(node) && ts.isStringLiteral(node.name)) {
        const importPath = node.name.text
        const replacedPath = replaceAliases(importPath, factory)
        if (replacedPath) {
          return factory.updateModuleDeclaration(node, node.decorators, node.modifiers, replacedPath, node.body)
        }
      }
      return ts.visitEachChild(node, visitor, context)
    }

    return function transformer(source: ts.SourceFile) {
      return ts.visitEachChild(source, visitor, context)
    }
  }

  return {
    after: transformerFactory,
    afterDeclarations: transformerFactory,
  }

}

export default transformAliases
