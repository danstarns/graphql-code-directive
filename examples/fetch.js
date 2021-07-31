const { ApolloServer, gql } = require("apollo-server");
const codeDirective = require("graphql-code-directive");
const fetch = require("node-fetch");

const typeDefs = gql`
  type Todo {
    id: ID!
    userId: ID!
    title: String!
    completed: Boolean
    user: User
      @code(
        source: """
        const response = await context.fetch('https://jsonplaceholder.typicode.com/users?id=' + rootValue.userId);
        const users = await response.json();
        return users[0]
        """
      )
  }

  type Address {
    street: String!
    suite: String
    city: String
    zipcode: String
  }

  type User {
    id: ID!
    name: String!
    email: String!
    address: Address
    phone: String
    website: String
    todos: [Todo]
      @code(
        source: """
        const response = await context.fetch('https://jsonplaceholder.typicode.com/todos?userId=' + rootValue.id);
        return response.json()
        """
      )
  }

  type Query {
    todos: [Todo]
      @code(
        source: """
        const response = await context.fetch('https://jsonplaceholder.typicode.com/todos');
        return response.json()
        """
      )
    users: [User]
      @code(
        source: """
        const response = await context.fetch('https://jsonplaceholder.typicode.com/users');
        return response.json()
        """
      )
  }
`;

const server = new ApolloServer({
  typeDefs: [codeDirective.typeDefs, typeDefs],
  schemaDirectives: {
    code: codeDirective.CodeDirective,
  },
  context: () => {
    return {
      fetch,
    };
  },
});

server.listen(4000).then(() => console.log("http://localhost:4000"));
