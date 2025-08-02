/**
 * PATCHED FILE index.js
 *
 * Vulnerability: GraphQL Batching Abuse
 *
 * The original code allowed for batched GraphQL queries. An attacker could
 * exploit this by sending a large number of PIN verification mutations in a
 * single HTTP request, effectively bypassing the rate-limiting middleware
 * that was configured on a per-request basis. This would allow for a
 * rapid brute-force attack on the 4-digit PIN.
 *
 * Fix:
 *
 * The `allowBatchedHttpRequests` option in the Apollo Server configuration
 * has been explicitly set to `false`. This ensures that only one GraphQL
 * operation can be processed per HTTP request, making the rate-limiting
 * middleware effective against brute-force attempts.
 */
import express from 'express';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express4';
import { ApolloArmor } from '@escape.tech/graphql-armor';
import { typeDefs } from './schema/index.js';
import { resolvers } from './schema/resolvers.js';
import { initializeDatabase } from './utils/database.js';
import { limiter, sessionConfig, setupBasicMiddleware } from './utils/middleware.js';
import router from './routes/index.js';

const NODE_ENV="production";
const app = express();
const port = 8000;

// Initialize database
const db = initializeDatabase();

// Setup middleware
app.use(sessionConfig);
setupBasicMiddleware(app);

app.set('trust proxy', 1);
app.use('/challenge/', router);

// Configure GraphQL Armor (no type annotation)
const armorConfig = {
  maxAliases: {
    n: 1,
  },
  maxDepth: {
    n: 2,
  },
  maxTokens: {
    enabled: false,
  },
  blockFieldSuggestion: {
    enabled: true,
  },
};

const armor = new ApolloArmor(armorConfig);

// Create Apollo Server,
const server = new ApolloServer({
  ...armor.protect(),
  introspection: false,
  typeDefs,
  allowBatchedHttpRequests: false,
  resolvers
});

// Start server and apply middleware
(async () => {
  await server.start();

  app.use('/challenge/graphql', limiter);
  app.use('/challenge/graphql', express.json());

  app.use('/challenge/graphql', expressMiddleware(server, {
    context: async ({ req, res }) => ({ req, res, db })
  }));

  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}/challenge/graphql`);
    console.log(`GraphQL Armor protection enabled`);
  });
})();