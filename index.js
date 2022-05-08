/** @format */

const express = require("express");
const cors = require("cors");
const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
// var MongoClient = require('mongodb').MongoClient;
const jwt = require("jsonwebtoken");
// var MongoClient = require('mongodb').MongoClient;
require("dotenv").config();
const port = process.env.PORT || 5000;
const app = express();

// use middleware
app.use(cors());
app.use(express.json());

function varifyJWT(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).send({ message: "unauthorized access" });
  }
  const token = authHeader.split(" ")[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).send({ message: "Forbidden access" });
    }
    console.log("decoded", decoded);
    req.decoded = decoded;
    next();
  });
}

var uri = `mongodb://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0-shard-00-00.v85be.mongodb.net:27017,cluster0-shard-00-01.v85be.mongodb.net:27017,cluster0-shard-00-02.v85be.mongodb.net:27017/myFirstDatabase?ssl=true&replicaSet=atlas-e24feo-shard-0&authSource=admin&retryWrites=true&w=majority`;
const client = new MongoClient(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  serverApi: ServerApiVersion.v1
});

async function run() {
  try {
    await client.connect();
    const productCollection = client
      //database name bosate hobe
      .db("BookHouseSimple")
      //collection name bosate hobe
      .collection("books");

    //for bookreqest collection
    const requestCollection = client
      .db("BookHouseSimple")
      .collection("request");

    //for auth and jwt for login
    app.post("/login", async (req, res) => {
      const user = req.body;
      //emailke object er moto die dite hobe
      console.log(user);
      const accessToken = jwt.sign(user, process.env.ACCESS_TOKEN_SECRET, {
        expiresIn: "1d"
      });
      res.send({ accessToken });
      console.log(accessToken);
    });

    //backend er datake ui te pathanor jonno nicher re.send app.get er moddho
    app.get("/book", async (req, res) => {
      console.log("query", req.query);
      const page = parseFloat(req.query.page);
      const size = parseFloat(req.query.size);

      const query = {};
      const cursor = productCollection.find(query);

      //.limit(er vetore joto songkha likhbothik totota dekhabe) const products = await cursor.limit(10)toArray();
      //prottok page  aalada alada data set korar jonno main data gulo
      let products;
      if (page || size) {
        products = await cursor
          .skip(page * size)
          .limit(size)
          .toArray();
      } else {
        products = await cursor.toArray();
      }
      res.send(products);
    });

    //product count korar jonno api te  koita product ache ta dekhar jonno
    app.get("/productCount", async (req, res) => {
      // const query = {};
      // const cursor = productCollection.find(query);
      //.limit(er vetore joto songkha likhbothik totota dekhabe) const products = await cursor.limit(10)toArray();
      const count = await productCollection.estimatedDocumentCount();
      console.log(count);
      res.send({ count });
    });

    //id dara query toiri kora
    app.get("/book/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);
      const query = { _id: ObjectId(id) };
      const product = await productCollection.findOne(query);
      res.send(product);
    });

    //update 1
    app.put("/book/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);

      const updateUser = req.body;
      console.log(updateUser);

      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          quantity: updateUser.quantity
        }
      };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    //update2
    app.put("/update/:id", async (req, res) => {
      const id = req.params.id;
      console.log(id);

      const updateUser = req.body;
      console.log(updateUser);

      const filter = { _id: ObjectId(id) };
      const options = { upsert: true };
      const updatedDoc = {
        $set: {
          quantity: updateUser.quantity
        }
      };
      const result = await productCollection.updateOne(
        filter,
        updatedDoc,
        options
      );
      res.send(result);
    });

    //search query

    app.get("/books", varifyJWT, async (req, res) => {
      const email = req.query.email;
      console.log(email);
      const decodedEmail = req.decoded.email;
      if (email === decodedEmail) {
        const query = { email: email };
        const cursor = productCollection.find(query);
        const products = await cursor.toArray();
        res.send(products);
      } else {
        res.status(403).send({ message: "forbidden access" });
      }
    });

    //post kora ba add kora

    app.post("/book", async (req, res) => {
      const newproduct = req.body;
      console.log(req.body);
      const result = await productCollection.insertOne(newproduct);
      res.send(result);
    });

    //delete button
    app.delete("/book/:id", async (req, res) => {
      const id = req.params.id;
      const query = { _id: ObjectId(id) };
      const result = await productCollection.deleteOne(query);
      res.send(result);
    });

    //client side the post kora
    app.post("/request", async (req, res) => {
      const order = req.body;
      const request = await requestCollection.insertOne(order);
      res.send(request);
    });
    //server theke client a newa
    app.get("/request", async (req, res) => {
      const query = {};
      const cursor = requestCollection.find(query);
      const request = await cursor.toArray();
      res.send(request);
    });
    
  } finally {
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("running jenius server");
});

app.listen(port, () => {
  console.log("listening to port variable");
});
