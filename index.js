require("dotenv").config();
const express = require("express");
const app = express();
const port = process.env.PORT || 4545;
const cors = require("cors");

// Middleware
app.use(cors());
app.use(express.json());

const { MongoClient, ServerApiVersion, ObjectId } = require("mongodb");
const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.fx40ttv.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`;

// Create a MongoClient with a MongoClientOptions object to set the Stable API version
const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  },
});

async function run() {
  try {
    // Connect the client to the server	(optional starting in v4.7)
    await client.connect();
    const database = client.db("task_management");
    const usersCollection = database.collection("users");
    const tasksCollection = database.collection("tasks");

    // set user
    app.post("/setUser", async (req, res) => {
      const userInfo = req.body;
      try {
        // Check if user already exists
        const query = {
          email: userInfo.email,
        };
        let user = await usersCollection.findOne(query);
        if (!user) {
          const result = await usersCollection.insertOne(userInfo);
          res.send(result);
        } else {
          return res.status(200).send({ message: "User  already exists" });
        }
      } catch (error) {
        console.error("Error saving user data:", error);
        return res.status(500).send({ error: "Failed to save user data" });
      }
    });

    // task save
    app.post("/tasks", async (req, res) => {
      const tasks = req.body;
      const result = await tasksCollection.insertOne(tasks);
      res.send(result);
    });

    app.get("/tasks", async (req, res) => {
      const email = req.query;
      const result = await tasksCollection
        .find(email)
        .sort({ createdAt: -1 })
        .toArray();
      res.send(result);
    });
    app.get("/tasks/:id", async (req, res) => {
      const id = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await tasksCollection.findOne(query);
      res.send(result);
    });
    app.delete("/tasks/:id", async (req, res) => {
      const id = req.params;
      const query = { _id: new ObjectId(id) };
      const result = await tasksCollection.deleteOne(query);
      res.send(result);
    });

    app.put("/tasks/:id", async (req, res) => {
      const id = req.params;
      const task = req.body;
      const query = { _id: new ObjectId(id) };
      const updateDoc = {
        $set: {
          title: task?.title,
          description: task?.description,
          createdAt: task?.createdAt,
        },
      };
      const result = await tasksCollection.updateOne(query, updateDoc);
      res.send(result);
    });

    await client.db("admin").command({ ping: 1 });
    console.log(
      "Pinged your deployment. You successfully connected to MongoDB!"
    );
  } finally {
    // Ensures that the client will close when you finish/error
    // await client.close();
  }
}
run().catch(console.dir);

app.get("/", (req, res) => {
  res.send("Hello World!");
});

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});
