import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString, max: 20 }); //default pool is 10, bump it so requests don't queue waiting for a connection under load
const prisma = new PrismaClient({ adapter });

export { prisma };