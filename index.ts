import { PrismaClient } from '@prisma/client'
import { time } from 'console'
import express, { Express, Request, Response } from "express";
import dotenv from "dotenv";
import { deleteIdentify, getIdentify, postIdentify, putIdentify } from './controller/identity'
import bodyParser, { BodyParser } from 'body-parser';

dotenv.config();

const prisma = new PrismaClient()


const app: Express = express();
// app.use(bodyParser.json());
async function main() {

    // ... you will write your Prisma Client queries here
    // const date = new Date();
    // const contact = await prisma.contact.create({
        //     data: {
    //         phoneNumber: '123456',
    //         email: 'alice@ex.io',
    //         linkPrecedence: "primary",
    //         updatedAt: date,
    //         deletedAt: date
    //     },
    // })
    // console.log(contact);
}
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error(e)
    await prisma.$disconnect()
    process.exit(1)
  })
  const port = process.env.PORT || 3000;
  
  app.get("/", (req: Request, res: Response) => {
      res.send("Express + TypeScript Server");
  });
app.get("/identify", getIdentify);
app.post("/identify", postIdentify);
app.put("/identify", putIdentify);
app.delete("/identify", deleteIdentify);

app.listen(port, () => {
  console.log(`[server]: Server is running at http://localhost:${port}`);
});
