/* eslint-disable @typescript-eslint/ban-ts-comment */
import { expect } from "chai";
import * as codeDirective from "../src";
import { createTestClient } from "apollo-server-testing";
import { ApolloServer } from "apollo-server";

describe("graphql-code-directive", () => {
    it("should have typeDefs", () => {
        expect(codeDirective.typeDefs).to.be.a("string");
    });

    it("should have a directive property", () => {
        expect(Boolean(codeDirective.Directive)).to.equal(true);
    });

    it("should execute and return the argument of a Query", async () => {
        const typeDefs = `
            type Query {
                test(arg: String!): String! @code(source: """
                    return args.arg;
                """)
            }
        `;

        const server = new ApolloServer({
            typeDefs: [codeDirective.typeDefs, typeDefs],
            // @ts-ignore
            schemaDirectives: { code: codeDirective.Directive },
        });

        const { query } = createTestClient(server);

        const testString = "testing-something-here-dont-mind-me";

        const res = await query({
            query: `{ test(arg: "${testString}")}`,
        });

        expect(res.errors).to.equal(undefined);

        expect((res.data as any).test).to.equal(testString);
    });

    it("should execute and return the argument of a Field", async () => {
        const typeDefs = `
            type User {
                test(arg: String!): String! @code(source: """
                    return args.arg;
                """)
            }

            type Query {
                users: [User]
            }
        `;

        const server = new ApolloServer({
            typeDefs: [codeDirective.typeDefs, typeDefs],
            resolvers: { Query: { users: () => [{}] } },
            // @ts-ignore
            schemaDirectives: { code: codeDirective.Directive },
        });

        const { query } = createTestClient(server);

        const testString = "testing-something-here-dont-mind-me";

        const res = await query({
            query: `{ users { test(arg: "${testString}") } }`,
        });

        expect(res.errors).to.equal(undefined);

        expect((res.data as any).users[0].test).to.equal(testString);
    });

    it("should execute and resolve a promise", async () => {
        const typeDefs = `
            type User {
                test(arg: String!): String! @code(source: """
                    return new Promise((resolve) => resolve(args.arg))
                """)
            }

            type Query {
                users: [User]
            }
        `;

        const server = new ApolloServer({
            typeDefs: [codeDirective.typeDefs, typeDefs],
            resolvers: { Query: { users: () => [{}] } },
            // @ts-ignore
            schemaDirectives: { code: codeDirective.Directive },
        });

        const { query } = createTestClient(server);

        const testString = "testing-something-here-dont-mind-me";

        const res = await query({
            query: `{ users { test(arg: "${testString}") } }`,
        });

        expect(res.errors).to.equal(undefined);

        expect((res.data as any).users[0].test).to.equal(testString);
    });

    it("should catch and return an error", async () => {
        const typeDefs = `
            type User {
                test(arg: String!): String! @code(source: """
                    throw new Error("fail")
                """)
            }

            type Query {
                users: [User]
            }
        `;

        const server = new ApolloServer({
            typeDefs: [codeDirective.typeDefs, typeDefs],
            resolvers: { Query: { users: () => [{}] } },
            // @ts-ignore
            schemaDirectives: { code: codeDirective.Directive },
        });

        const { query } = createTestClient(server);

        const testString = "testing-something-here-dont-mind-me";

        const res = await query({
            query: `{ users { test(arg: "${testString}") } }`,
        });

        expect(res.errors[0].message).to.equal("fail");
    });

    it("should execute an async function set on the context and return the value", async () => {
        const typeDefs = `
            type User {
                test: String! @code(source: """
                    return context.testFunction()
                """)
            }

            type Query {
                users: [User]
            }
        `;

        async function testFunction() {
            return "testFunction";
        }

        const server = new ApolloServer({
            typeDefs: [codeDirective.typeDefs, typeDefs],
            resolvers: { Query: { users: () => [{}] } },
            context: { testFunction },
            // @ts-ignore
            schemaDirectives: { code: codeDirective.Directive },
        });

        const { query } = createTestClient(server);

        const res = await query({
            query: `{ users { test } }`,
        });

        expect((res.data as any).users[0].test).to.equal(await testFunction());
    });
});
