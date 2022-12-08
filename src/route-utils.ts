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

  function getInterfaceRouteParams(typeElements: ts.TypeElement[]) {
    const interfaceSingleParams = new Set<string>();
    const invalidParams = new Set<string>();
    for (const node of typeElements) {
      if (ts.isPropertySignature(node)) {
        if (node.type && node.type.getText() === "string") {
          interfaceSingleParams.add(node.name.getText());
        } else {
          invalidParams.add(node.name.getText());
        }
      }
    }

    return { interfaceSingleParams, invalidParams };
  }

  return { isDefaultExport, getInterfaceRouteParams };
}

export function getFileNameParams(fileName: string) {
  const fileSingleParams = new Set(
    [...fileName.matchAll(/\[(\w+)\]/g)].map((n) => n[1])
  );
  const fileSpreadParams = new Set(
    [...fileName.matchAll(/\[\.\.\.(\w+)\]/g)].map((n) => n[1])
  );

  return { fileSingleParams, fileSpreadParams };
}
