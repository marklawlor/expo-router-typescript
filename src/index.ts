import { basename } from "node:path";
import { EXPO_TS_ERRORS } from "./errors";
import { createTSHelpers, getFileNameParams } from "./route-utils";

function init(modules: {
  typescript: typeof import("typescript/lib/tsserverlibrary");
}) {
  const ts = modules.typescript;

  const { isDefaultExport, getInterfaceRouteParams } = createTSHelpers(ts);

  function create(info: ts.server.PluginCreateInfo) {
    function log(...messages: string[]) {
      info.project.projectService.logger.info(messages.join(" "));
    }

    function error(message: string) {
      info.project.projectService.logger.msg(message, ts.server.Msg.Err);
    }

    const projectDir = info.project.getCurrentDirectory();
    const appDir = new RegExp(
      `^${projectDir}(/src)?/app`.replace(/[\\/]/g, "[\\/]")
    );

    const isRouteFile = (filePath: string) => {
      return (
        appDir.test(filePath) &&
        !/^_.+\.(mjs|js|jsx|ts|tsx)$/.test(basename(filePath))
      );
    };

    log("Starting Expo Router TypeScript plugin:", projectDir);

    // Set up decorator object
    const proxy: ts.LanguageService = Object.create(null);
    for (let k of Object.keys(info.languageService) as Array<
      keyof ts.LanguageService
    >) {
      const x = info.languageService[k]!;
      // @ts-expect-error - JS runtime trickery which is tricky to type tersely
      proxy[k] = (...args: Array<{}>) => x.apply(info.languageService, args);
    }

    proxy.getSemanticDiagnostics = (fileName: string) => {
      const prior = info.languageService.getSemanticDiagnostics(fileName);

      // Ensure this file is inside our `app/` directory
      if (!isRouteFile(fileName)) return prior;

      const source = info.languageService.getProgram()?.getSourceFile(fileName);

      if (!source) return prior;

      const interfaceMap = new Map<string, ts.TypeElement[]>();

      ts.forEachChild(source!, (node) => {
        if (ts.isInterfaceDeclaration(node)) {
          interfaceMap.set(node.name.getText(), [...node.members]);
        } else if (ts.isFunctionDeclaration(node)) {
          // `export default function`
          if (isDefaultExport(node)) {
            const firstParameter = node.parameters?.[0];

            const props = firstParameter?.name as
              | ts.ObjectBindingPattern
              | undefined;

            // For route entries, it can only have `route` as the prop names.
            if (props && ts.isObjectBindingPattern(props)) {
              for (const prop of props.elements) {
                const propName = prop.name.getText();
                if (propName !== "route") {
                  prior.push({
                    file: source,
                    category: ts.DiagnosticCategory.Error,
                    code: EXPO_TS_ERRORS.INVALID_PAGE_PROP,
                    messageText: `"${propName}" is not a valid Expo route property.`,
                    start: prop.getStart(),
                    length: prop.getWidth(),
                  });
                }
              }
            }

            if (
              firstParameter.type &&
              ts.isTypeReferenceNode(firstParameter.type)
            ) {
              if (
                ts.isIdentifier(firstParameter.type.typeName) &&
                firstParameter.type.typeName.getText() === "RouteProps"
              ) {
                const firstTypeArgumentNode =
                  firstParameter.type.typeArguments?.[0];
                const firstTypeArgument = firstTypeArgumentNode?.getText();
                const routeInterface =
                  firstTypeArgument && interfaceMap.get(firstTypeArgument);

                if (firstTypeArgumentNode && routeInterface) {
                  const { fileSingleParams, fileSpreadParams } =
                    getFileNameParams(fileName);

                  const {
                    interfaceSingleParams,
                    interfaceSpreadParams,
                    invalidParams,
                  } = getInterfaceRouteParams(routeInterface);

                  // Check for required file parameters
                  for (const fileSingleParam of fileSingleParams) {
                    if (!interfaceSingleParams.has(fileSingleParam)) {
                      prior.push({
                        file: source,
                        category: ts.DiagnosticCategory.Error,
                        code: EXPO_TS_ERRORS.INVALID_PAGE_PROP,
                        messageText: `Missing "${fileSingleParam}" from route params.`,
                        start: firstTypeArgumentNode.getStart(),
                        length: firstTypeArgumentNode.getWidth(),
                      });
                    }
                  }

                  for (const fileSpreadParam of fileSpreadParams) {
                    if (!interfaceSpreadParams.has(fileSpreadParam)) {
                      prior.push({
                        file: source,
                        category: ts.DiagnosticCategory.Error,
                        code: EXPO_TS_ERRORS.INVALID_PAGE_PROP,
                        messageText: `Missing "${fileSpreadParam}" from route params.`,
                        start: firstTypeArgumentNode.getStart(),
                        length: firstTypeArgumentNode.getWidth(),
                      });
                    }
                  }

                  // Check for invalid parameters
                  for (const interfaceSingleParam of interfaceSingleParams) {
                    if (!fileSingleParams.has(interfaceSingleParam)) {
                      prior.push({
                        file: source,
                        category: ts.DiagnosticCategory.Error,
                        code: EXPO_TS_ERRORS.INVALID_PAGE_PROP,
                        messageText: `Attribute "${interfaceSingleParam}" is not found on the route.`,
                        start: firstTypeArgumentNode.getStart(),
                        length: firstTypeArgumentNode.getWidth(),
                      });
                    }
                  }

                  for (const interfaceSpreadParam of interfaceSpreadParams) {
                    if (!fileSpreadParams.has(interfaceSpreadParam)) {
                      prior.push({
                        file: source,
                        category: ts.DiagnosticCategory.Error,
                        code: EXPO_TS_ERRORS.INVALID_PAGE_PROP,
                        messageText: `Attribute "${interfaceSpreadParam}" is not found on the route.`,
                        start: firstTypeArgumentNode.getStart(),
                        length: firstTypeArgumentNode.getWidth(),
                      });
                    }
                  }

                  for (const invalidParam of invalidParams) {
                    prior.push({
                      file: source,
                      category: ts.DiagnosticCategory.Error,
                      code: EXPO_TS_ERRORS.INVALID_PAGE_PROP,
                      messageText: `Attribute "${invalidParam}" is not found on the route.`,
                      start: firstTypeArgumentNode.getStart(),
                      length: firstTypeArgumentNode.getWidth(),
                    });
                  }
                }
              }
            }
          }
        }
      });

      return prior;
    };

    return proxy;
  }

  return { create };
}

export = init;
