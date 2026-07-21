import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client.js";

const connectionString = `${process.env.DATABASE_URL}`;

const adapter = new PrismaPg({ connectionString, max: 40 }); //bumped from 20 to reduce pool contention under sustained load
const prisma = new PrismaClient({ adapter });

export { prisma };