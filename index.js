import express from "express";
import mongoose from "mongoose";
import dotenv from 'dotenv';
import cors from 'cors';
import http from 'http';

import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import { ApolloServerPluginDrainHttpServer } from '@apollo/server/plugin/drainHttpServer';

import router from './router/router.js';
import { errorHandler } from "./middlewares/errorHandler.js";
import { queryResolver, mutationResolver } from "./resolvers/index.js";
import { typeDefs } from "./schema/typeDefs.js";

dotenv.config();

mongoose.set({ strictQuery: true });
mongoose
    .connect(process.env.MONGO_DB)
    .then(() => console.log('Mongoose DB connected...'))
    .catch((err) => console.log('DB Error:', err))

const app = express();
const httpServer = http.createServer(app);

app.use(cors());
app.use(express.json());
app.use('/api', router);
app.use('/api/upload', express.static('uploads'));

const port = process.env.PORT || 4001;

const server = new ApolloServer({
    typeDefs,
    resolvers: { ...queryResolver, ...mutationResolver },
    formatError: (formattedError, error) => {
        return error
    },
    plugins: [ApolloServerPluginDrainHttpServer({ httpServer }), {
        async serverWillStart() {
            console.log(`Apollo server has been started on port ${port}`);
        },
    }],
});

await server.start();

app.use('/graphql', cors(),
    expressMiddleware(server, {
        context: async ({ req, res }) => {
            const token = req.headers.authorization || '';
            return { token };
        },
    }),
);

app.use(errorHandler);

await new Promise((resolve) => httpServer.listen({ port }, resolve));
