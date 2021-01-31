const { ApolloServer } = require("apollo-server")
const codeDirective = require("graphql-code-directive");
const fetch = require("node-fetch");

const typeDefs = `
    type Todo {
        id: ID!
        userId: ID!
        title: String!	
        completed: Boolean	
    }

    type Query {
        todos: [Todo] 
            @code(
                source: """
                const response = await context.fetch('https://jsonplaceholder.typicode.com/todos');
                return response.json()
                """
            )		
    }
`;

const server = new ApolloServer({
    typeDefs: [codeDirective.typeDefs, typeDefs],
    schemaDirectives: {
        code: codeDirective.Directive,
    },
    context: () => {
        return {
            fetch
        }
    }
});

async function main() {
    await server.listen(4000);

    console.log("http://localhost:4000");
}

main();