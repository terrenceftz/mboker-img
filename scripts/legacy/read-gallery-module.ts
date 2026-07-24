import { readFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';

import ts from 'typescript';

export type LegacyResponsiveSize = Partial<Record<'default' | 'sm' | 'md' | 'lg' | 'xl' | 'xxl', string>>;

export type LegacyGalleryImage = {
  sourcePath: string;
  alt: string;
  order?: number;
  layout: {
    cols?: LegacyResponsiveSize;
    offset?: LegacyResponsiveSize;
    align?: 'start' | 'center' | 'end';
    class?: string;
    hasBackground?: boolean;
    padding?: string;
  };
};

export type LegacyGallery = {
  id: string;
  slug: string;
  title: string;
  titleEn: string;
  description: string;
  date: string;
  location?: string;
  tags?: string[];
  seo?: { title?: string; description?: string; keywords?: string[] };
  featured?: boolean;
  coverIndex?: number;
  images: LegacyGalleryImage[];
};

type LiteralValue = string | number | boolean | null | LiteralValue[] | { [key: string]: LiteralValue };

function syntaxError(filename: string, node: ts.Node, message: string): never {
  const source = node.getSourceFile();
  const position = source.getLineAndCharacterOfPosition(node.getStart(source));
  throw new Error(`${filename}:${position.line + 1}:${position.character + 1}: ${message}`);
}

function unwrap(node: ts.Expression): ts.Expression {
  if (
    ts.isParenthesizedExpression(node) ||
    ts.isAsExpression(node) ||
    ts.isTypeAssertionExpression(node) ||
    ts.isSatisfiesExpression(node)
  ) {
    return unwrap(node.expression);
  }
  return node;
}

function propertyName(filename: string, name: ts.PropertyName) {
  if (ts.isComputedPropertyName(name)) syntaxError(filename, name, 'Computed object keys are not allowed.');
  if (ts.isIdentifier(name) || ts.isStringLiteral(name) || ts.isNumericLiteral(name)) return name.text;
  return syntaxError(filename, name, 'Unsupported object key.');
}

function evaluate(
  filename: string,
  expression: ts.Expression,
  importedImages: ReadonlyMap<string, string>,
): LiteralValue {
  const node = unwrap(expression);
  if (ts.isStringLiteral(node) || ts.isNoSubstitutionTemplateLiteral(node)) return node.text;
  if (ts.isNumericLiteral(node)) return Number(node.text);
  if (node.kind === ts.SyntaxKind.TrueKeyword) return true;
  if (node.kind === ts.SyntaxKind.FalseKeyword) return false;
  if (node.kind === ts.SyntaxKind.NullKeyword) return null;
  if (ts.isPrefixUnaryExpression(node) && node.operator === ts.SyntaxKind.MinusToken) {
    const value = evaluate(filename, node.operand, importedImages);
    if (typeof value === 'number') return -value;
  }
  if (ts.isIdentifier(node)) {
    const imagePath = importedImages.get(node.text);
    if (imagePath) return imagePath;
    return syntaxError(filename, node, `Unknown identifier "${node.text}".`);
  }
  if (ts.isArrayLiteralExpression(node)) {
    return node.elements.map((element) => {
      if (ts.isSpreadElement(element)) return syntaxError(filename, element, 'Array spreads are not allowed.');
      return evaluate(filename, element, importedImages);
    });
  }
  if (ts.isObjectLiteralExpression(node)) {
    const value: Record<string, LiteralValue> = {};
    for (const property of node.properties) {
      if (ts.isSpreadAssignment(property)) syntaxError(filename, property, 'Object spreads are not allowed.');
      if (!ts.isPropertyAssignment(property)) {
        syntaxError(filename, property, 'Only explicit object properties are allowed.');
      }
      value[propertyName(filename, property.name)] = evaluate(filename, property.initializer, importedImages);
    }
    return value;
  }
  return syntaxError(filename, node, `Unsupported expression kind ${ts.SyntaxKind[node.kind]}.`);
}

function isExported(node: ts.Node) {
  return ts.canHaveModifiers(node) && ts.getModifiers(node)?.some((modifier) => modifier.kind === ts.SyntaxKind.ExportKeyword);
}

function findGalleryExpression(filename: string, sourceFile: ts.SourceFile) {
  let fallback: ts.Expression | undefined;
  for (const statement of sourceFile.statements) {
    if (ts.isExportAssignment(statement) && !statement.isExportEquals) return statement.expression;
    if (!ts.isVariableStatement(statement) || !isExported(statement)) continue;
    for (const declaration of statement.declarationList.declarations) {
      if (!declaration.initializer) continue;
      if (declaration.type?.getText(sourceFile).includes('GalleryConfig')) return declaration.initializer;
      if (ts.isObjectLiteralExpression(unwrap(declaration.initializer))) fallback ??= declaration.initializer;
    }
  }
  return fallback ?? syntaxError(filename, sourceFile, 'No exported GalleryConfig object was found.');
}

function assertGallery(filename: string, value: LiteralValue): LegacyGallery {
  if (!value || Array.isArray(value) || typeof value !== 'object') throw new Error(`${filename}: Gallery config must be an object.`);
  const gallery = value as Record<string, LiteralValue>;
  for (const key of ['id', 'slug', 'title', 'titleEn', 'description', 'date']) {
    if (typeof gallery[key] !== 'string') throw new Error(`${filename}: Gallery field "${key}" must be a string.`);
  }
  if (!Array.isArray(gallery.images)) throw new Error(`${filename}: Gallery images must be an array.`);

  const images = gallery.images.map((item, index) => {
    if (!item || Array.isArray(item) || typeof item !== 'object') throw new Error(`${filename}: Image ${index} must be an object.`);
    const image = item as Record<string, LiteralValue>;
    if (typeof image.src !== 'string' || typeof image.alt !== 'string') {
      throw new Error(`${filename}: Image ${index} requires an imported src and string alt.`);
    }
    const layout = image.layout;
    if (!layout || Array.isArray(layout) || typeof layout !== 'object') {
      throw new Error(`${filename}: Image ${index} layout must be an object.`);
    }
    return { sourcePath: image.src, alt: image.alt, layout, ...(typeof image.order === 'number' ? { order: image.order } : {}) } as LegacyGalleryImage;
  });

  return { ...gallery, images } as unknown as LegacyGallery;
}

export async function readGalleryModule(filename: string): Promise<LegacyGallery> {
  const absoluteFilename = resolve(filename);
  const sourceText = await readFile(absoluteFilename, 'utf8');
  const sourceFile = ts.createSourceFile(absoluteFilename, sourceText, ts.ScriptTarget.Latest, true, ts.ScriptKind.TS);
  const importedImages = new Map<string, string>();

  for (const statement of sourceFile.statements) {
    if (!ts.isImportDeclaration(statement) || statement.importClause?.isTypeOnly) continue;
    const identifier = statement.importClause?.name;
    if (!identifier || !ts.isStringLiteral(statement.moduleSpecifier)) continue;
    importedImages.set(identifier.text, resolve(dirname(absoluteFilename), statement.moduleSpecifier.text));
  }

  return assertGallery(absoluteFilename, evaluate(absoluteFilename, findGalleryExpression(absoluteFilename, sourceFile), importedImages));
}
