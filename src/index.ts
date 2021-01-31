import { SchemaDirectiveVisitor } from "@graphql-tools/utils";
import {
    GraphQLField,
    DirectiveNode,
    ArgumentNode,
    StringValueNode,
} from "graphql";
import * as vm from "vm";
import * as util from "util";
import * as crypto from "crypto";

export const typeDefs = `
    directive @code(source: String!) on FIELD_DEFINITION
`;

export class Directive extends SchemaDirectiveVisitor {
    // eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
    visitFieldDefinition(field: GraphQLField<any, any>) {
        const directive = field.astNode.directives.find(
            (x) => x.name.value === "code"
        ) as DirectiveNode;

        const source = ((directive.arguments.find(
            (x) => x.name.value === "source"
        ) as ArgumentNode).value as StringValueNode).value;

        field.resolve = async function (rootValue, args, context, resolveInfo) {
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
}
