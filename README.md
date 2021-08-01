# graphql-code-directive

<p align="center">
  <a href="https://www.npmjs.com/package/graphql-code-directive">
    <img alt="npm package" src="https://badge.fury.io/js/graphql-code-directive.svg">
  </a>
  <a href="https://github.com/danstarns/graphql-code-directive/actions/workflows/npmpublish.yml">
    <img alt="Publish" src="https://github.com/danstarns/graphql-code-directive/actions/workflows/npmpublish.yml/badge.svg">
  </a>
  <a href="https://github.com/danstarns/graphql-code-directive/actions/workflows/nodejs.yml">
    <img alt="Tests" src="https://github.com/danstarns/graphql-code-directive/actions/workflows/nodejs.yml/badge.svg">
  </a>
</p>

Use a GraphQL Schema Directive to define Javascript logic, have that logic executed as a resolver.

## Links

1. [NPM](https://www.npmjs.com/package/graphql-code-directive)
2. [Examples](https://github.com/danstarns/graphql-code-directive/blob/main/examples/fetch.js)
3. [Blog Post](https://medium.com/@danstarns/writing-javascript-directly-in-your-graphql-schema-285ae7906d94)

## What

Its a directive you can use on Fields:

```graphql
directive @code(source: String!) on FIELD_DEFINITION
```

You define Javascript logic in the `source` argument. The source is wrapped in an IFFE & passed into a [https://nodejs.org/api/vm.html](https://nodejs.org/api/vm.html). Supports Promises & you can use dependency injection via the context.

## Installing

```bash
$ npm install graphql-code-directive
```

## Usage

```js
const { ApolloServer } = require("apollo-server");
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
    code: codeDirective.CodeDirective,
  },
  context: () => {
    return {
      fetch,
    };
  },
});

server.listen(4000).then(() => console.log("http://localhost:4000"));
```

## FAQ

### How to dependency inject ?

Inside the code source you have access to the four global variables:

1. `rootValue`
2. `args`
3. `context`
4. `resolveInfo`

So for example if you were to write a 'Normal' Javascript resolver the variables would map to each argument:

```javascript
function myResolver(rootValue, args, context, resolveInfo) {}
```

### Is this safe ?

Make sure you disable introspection & yes it is safe. You are in control of what the VM has access to, via `context`, and the Node.js team has done a good job at isolating the VM.

### Is it testable ?

Unit testing could become cumbersome, this is because you would have to parse the definitions into an AST in order to access the `source`. You can however write solid integration tests, why not checkout [https://www.apollographql.com/docs/apollo-server/testing/testing/](https://www.apollographql.com/docs/apollo-server/testing/testing/) ?

### Can I use the new Schema Directives ?

Yes! There are 3 exports:

1. `typeDefs` - A string of the directives type definitions
2. `CodeDirective` - A legacy `SchemaDirectiveVisitor` that you are most likely to be familiar with
3. `codeDirective` - A functional approach to Schema Directives that returns a transformer

#### Using with new Schema Directives

```js
const { codeDirective } = require("graphql-code-directive");
const { makeExecutableSchema } = require("@graphql-tools/schema");

const { codeDirectiveTypeDefs, codeDirectiveTransformer } = codeDirective();

let schema = makeExecutableSchema({
  typeDefs: [codeDirectiveTypeDefs, typeDefs],
  resolvers: { Query: { users: () => [{}] } },
});

schema = codeDirectiveTransformer(schema);
```

## Licence

MIT licence.
