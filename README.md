# graphql-code-directive

Use a GraphQL Schema Directive to define Javascript logic, have that logic executed as a resolver.

```
$ npm i graphql-code-directive
```

## What

Its a directive you can use on Fields;

```graphql
directive @code(source: String!) on FIELD_DEFINITION
```

You define Javascript logic in the `source` argument. The source is wrapped in an IFFE & passed into a [https://nodejs.org/api/vm.html](https://nodejs.org/api/vm.html). Supports Promises & you can use dependency injection via the context.

## Why

Sometimes you have a really small function, for example - When you want to hide a user password to non-admins;

```js
const typeDefs = `
    type User {
        id: ID
        name: String!
        password: String!
    }
`;

const resolvers = {
    User: {
        password: (rootValue, args, context) => {
            if (!context.admin) {
                return null;
            }

            return rootValue.password;
        },
    },
};
```

Could you just define this in the Type Definitions ? Would it reduce lots of boiler plate ?

```graphql
type User {
    id: ID
    name: String!
    password: String!
        @code(
            source: """
            if(!context.admin){
                return null;
            }

            return rootValue.password;
            """
        )
}
```

## How

Installing;

```bash
$ npm install graphql-code-directive apollo-server
```

Usage;

```js
const { ApolloServer } = require("apollo-server");
const codeDirective = require("graphql-code-directive");

const typeDefs = `
    type User {
        id: ID!
        name: String!
        password: String! 
            @code(
                source: """
        	    if(!context.admin){
        	    	return null;
        	    }

        	    return rootValue.password;
                """
            )		
    }
    
    type Query {
        users: [User] 
            @code(
                source: """
    		    return [{ id: 1, name: "Dan", password: "letmein" }]
                """
            )		
    }
`;

const server = new ApolloServer({
    typeDefs: [codeDirective.typeDefs, typeDefs],
    schemaDirectives: {
        code: codeDirective.Directive,
    },
});

server.listen().then(({ url }) => {
    console.log(`🚀 Server ready at ${url}`);
});
```

The schema looks a little better with GraphQL highlighting imo 👌

```graphql
type User {
    id: ID!
    name: String!
    password: String!
        @code(
            source: """
            if(!context.admin){
            	return null;
            }

            return rootValue.password;
            """
        )
}

type Query {
    users: [User]
        @code(
            source: """
            return [{ id: 1, name: "Dan", password: "letmein" }]
            """
        )
}
```

## FAQ

### How to dependency inject ?

The arguments to the Field are available under the global `args` variable. You can also append stuff into the `context` of the execution.

Global values are;

1. `rootValue`
2. `args`
3. `context`
4. `resolveInfo`

### Is this safe ?

Make sure you disable introspection & yes it is safe. You are in control of what the VM has access to, via `context`, and the Node.js team has done a good job at isolating the VM.

### Is it testable ?

Unit testing could become cumbersome, this is because you would have to parse the AST in order to access the `source`. You can however write solid intergration tests, why not checkout [https://www.apollographql.com/docs/apollo-server/testing/testing/](https://www.apollographql.com/docs/apollo-server/testing/testing/) ?

## Licence

This software was made on a sunday afternoon with some beer 🍻 under the MIT licence.
