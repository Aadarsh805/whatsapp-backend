import express from "express";
import mongoose from "mongoose";
import Messages from "./dbMessages.js";
import Pusher from "pusher";
import cors from 'cors'

//app config
const app = express();
const port = process.env.PORT || 8001;

const pusher = new Pusher({
  appId: "1474871",
  key: "530a80d4d72f962541b2",
  secret: "260b0ed935b3cfebc1e0",
  cluster: "ap2",
  useTLS: true,
});

//middleware
app.use(express.json());
app.use(cors())

// app.use((req, res, next) => {
//     res.setHeader("Access-Control-Allow-Origin", "*")
//     res.setHeader("Access-Control-Allow-Headers", "*")
//     next()
// })

//DB config
const connection_url =
  "mongodb+srv://admin:GGHjkaa7gnpItE6T@cluster0.txx3ast.mongodb.net/?retryWrites=true&w=majority";

mongoose.connect(connection_url, {});

//

const db = mongoose.connection;

db.once("open", () => {
  console.log("DB connected");

  const msgCollection = db.collection("messagecontents");
  const changeStream = msgCollection.watch();

  changeStream.on("change", (change) => {
    console.log(change);

    if (change.operationType === "insert") {
      const messageDetails = change.fullDocument;
      pusher.trigger("messages", "inserted", {
        name: messageDetails.user,
        message: messageDetails.message,
        timestamp: messageDetails.timestamp,
        received: messageDetails.received,
      });
    } else {
      console.log("Error triggering pusher");
    }
  });
});

//api routes
app.get("/", (req, res) => {
  res.status(200).send("Za Warudo");
});

app.get("/messages/sync", (req, res) => {
  const dbMessage = req.body;

  Messages.find((err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(200).send(data);
    }
  });
});

app.post("/messages/new", (req, res) => {
  const dbMessage = req.body;

  Messages.create(dbMessage, (err, data) => {
    if (err) {
      res.status(500).send(err);
    } else {
      res.status(201).send(data);
    }
  });
});

//listener
app.listen(port, () => console.log(`listening on port: ${port}`));
