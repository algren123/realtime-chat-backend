const { GraphQLServer, PubSub } = require('graphql-yoga');

const messages = [];

const typeDefs = `
type Message {
    id: ID!
    user: String!
    content: String!
    picture: String!
    name: String!
  }
  type Query {
    messages: [Message!]
  }
  type Mutation {
    postMessage(user: String!, content: String!, picture: String!, name: String!): ID!
  }
  type Subscription {
    messages: [Message!]
  }
`;

const subscribers = [];
const onMessageUpdates = (fn) => subscribers.push(fn);

const resolvers = {
  Query: {
    messages: () => messages,
  },
  Mutation: {
    postMessage: (parent, { user, content, picture, name }) => {
      const id = messages.length;
      messages.push({
        id,
        user,
        content,
        picture,
        name,
      });
      subscribers.forEach((fn) => fn());
      return id;
    },
  },
  Subscription: {
    messages: {
      subscribe: (parent, args, { pubsub }) => {
        const channel = Math.random().toString(36).slice(2, 15);
        onMessageUpdates(() => pubsub.publish(channel, { messages }));
        setTimeout(() => pubsub.publish(channel, { messages }), 0);
        return pubsub.asyncIterator(channel);
      },
    },
  },
};

const pubsub = new PubSub();

const options = {
  port: 4000,
  endpoint: '/graphql',
  subscriptions: '/subscriptions',
  playground: '/playground',
};

const server = new GraphQLServer({
  typeDefs,
  resolvers,
  context: { pubsub },
  options,
});

server.start(options, ({ port }) => {
  console.log(`Server listening on: http://localhost:${port}`);
});
