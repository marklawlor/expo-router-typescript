import ts from "typescript/lib/tsserverlibrary";

export function createTSHelpers(
  ts: typeof import("typescript/lib/tsserverlibrary")
) {
  function isDefaultExport(node: ts.Node) {
    let hasExportKeyword = false;
    let hasDefaultKeyword = false;

    const modifiers = ts.canHaveModifiers(node)
      ? ts.getModifiers(node)
      : undefined;

    if (modifiers) {
      for (const modifier of modifiers) {
        if (modifier.kind === ts.SyntaxKind.ExportKeyword) {
          hasExportKeyword = true;
        } else if (modifier.kind === ts.SyntaxKind.DefaultKeyword) {
          hasDefaultKeyword = true;
        }
      }
    }

    return hasExportKeyword && hasDefaultKeyword;
  }

  function getRouteInterfaceParams(typeElements: ts.TypeElement[]) {
    const routeSingleParams = new Set<string>();
    for (const node of typeElements) {
      if (ts.isPropertySignature(node)) {
        if (node.type && node.type.getText() === "string") {
          routeSingleParams.add(node.name.getText());
        }
      }
    }

    return { routeSingleParams };
  }

  return { isDefaultExport, getRouteInterfaceParams };
}

export function getFileNameParams(fileName: string) {
  const singleParams = [...fileName.matchAll(/\[(\w+)\]/g)].map((n) => n[1]);
  const spreadParams = [...fileName.matchAll(/\[\.\.\.(\w+)\]/g)].map(
    (n) => n[1]
  );

  return { singleParams, spreadParams };
}
