import {
  SchemaDirectiveVisitor,
  MapperKind,
  mapSchema,
} from "@graphql-tools/utils";
import {
  GraphQLField,
  DirectiveNode,
  ArgumentNode,
  StringValueNode,
  GraphQLFieldConfig,
  GraphQLSchema,
} from "graphql";
import * as vm from "vm";
import * as util from "util";
import * as crypto from "crypto";

function resolve({ source }: { source: string }) {
  return async function (rootValue, args, context, resolveInfo) {
    const graphqlCodeDirectiveReturnValue = crypto
      .randomBytes(20)
      .toString("hex");

    const fakeFunction = `
          (async function() {
              graphqlCodeDirectiveReturnValue = await (async () => {
                  try {
                      ${source}
                  } catch (error) {
                      graphqlCodeDirectiveErrorValue = error.message
                  }
              })()
          })();
      `;

    const sandbox = vm.createContext({
      rootValue,
      args,
      context,
      resolveInfo,
      graphqlCodeDirectiveReturnValue,
      graphqlCodeDirectiveErrorValue: false,
    });

    const script = new vm.Script(fakeFunction);

    script.runInContext(sandbox);

    await (async () => {
      async function* gen() {
        while (true) {
          // To not block the event loop
          await util.promisify(setTimeout)(0);

          const error = sandbox.graphqlCodeDirectiveErrorValue;
          const hasChanged =
            sandbox.graphqlCodeDirectiveReturnValue !==
            graphqlCodeDirectiveReturnValue;

          if (error) {
            throw new Error(error);
          }

          if (hasChanged) {
            yield true;
            break;
          } else {
            continue;
          }
        }
      }

      return gen().next();
    })();

    return sandbox.graphqlCodeDirectiveReturnValue;
  };
}

function getDirective({
  field,
  name,
}: {
  field: GraphQLField<unknown, unknown> | GraphQLFieldConfig<unknown, unknown>;
  name;
}): DirectiveNode | undefined {
  const directive = field.astNode.directives.find(
    (x) => x.name.value === name
  ) as DirectiveNode;

  return directive;
}

function getSource(directive: DirectiveNode): string {
  const source = (
    (directive.arguments.find((x) => x.name.value === "source") as ArgumentNode)
      .value as StringValueNode
  ).value;

  return source;
}

export const typeDefs = `
    directive @code(source: String!) on FIELD_DEFINITION
`;

/*
  Use this class for the old graphql-tools schema directives
*/
export class CodeDirective extends SchemaDirectiveVisitor {
  visitFieldDefinition(field: GraphQLField<unknown, unknown>): void {
    const directive = getDirective({ field, name: "code" });

    if (directive) {
      const source = getSource(directive);

      field.resolve = resolve({ source });
    }
  }
}

/*
  Use this for the newer graphql-tools schema directives
*/
export function codeDirective(directiveName = "code"): {
  codeDirectiveTypeDefs: string;
  codeDirectiveTransformer: (schema: GraphQLSchema) => any;
} {
  return {
    codeDirectiveTypeDefs: typeDefs.replace("@code", `@${directiveName}`),
    codeDirectiveTransformer: (schema: GraphQLSchema) =>
      mapSchema(schema, {
        [MapperKind.OBJECT_FIELD]: (
          fieldConfig: GraphQLFieldConfig<any, any>
        ): GraphQLFieldConfig<any, any> | undefined => {
          const directive = getDirective({
            field: fieldConfig,
            name: directiveName,
          });

          if (directive) {
            const source = getSource(directive);

            fieldConfig.resolve = resolve({ source });

            return fieldConfig;
          }
        },
      }),
  };
}
