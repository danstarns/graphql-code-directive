import { SchemaDirectiveVisitor } from "@graphql-tools/utils";
import { GraphQLField, defaultFieldResolver } from "graphql";

export const typeDefs = `
    directive @code(source: String!) on FIELD_DEFINITION
`;

export class Directive extends SchemaDirectiveVisitor {
    visitFieldDefinition(field: GraphQLField<any, any>) {
        const { resolve = defaultFieldResolver } = field;
        field.resolve = async function (...args) {
            const result = await resolve.apply(this, args);
            if (typeof result === "string") {
                return result.toUpperCase();
            }
            return result;
        };
    }
}
