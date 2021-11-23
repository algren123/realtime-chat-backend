const { GraphQLServer, PubSub } = require('graphql-yoga');

let messages = [];

const typeDefs = `
type Message {
    id: ID!
    user: String!
    content: String!
    picture: String!
    name: String!
    date: String!
    time: String!
  }
  type Query {
    messages: [Message!]
  }
  type Mutation {
    postMessage(user: String!, content: String!, picture: String!, name: String!): ID!
    deleteMessage(id: ID!): ID!
    deleteAllMessages: Response!
  }
  type Response {
    success: Boolean!
    message: String!
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
    postMessage: (_, { user, content, picture, name }) => {
      const id = messages.length;
      const date = new Date().toLocaleDateString();
      const time = new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      });
      messages.push({
        id,
        user,
        content,
        picture,
        name,
        date,
        time,
      });
      subscribers.forEach((fn) => fn());
      return id;
    },
    deleteMessage: (_, { id }) => {
      const ID = parseInt(id);
      messages = messages.filter((chat) => chat.id !== ID);
      subscribers.forEach((fn) => fn());
      return id;
    },
    deleteAllMessages: (_) => {
      messages = [];
      subscribers.forEach((fn) => fn());
      return {
        success: true,
        message: 'Messages deleted',
      };
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
  port: process.env.PORT || 4000,
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
