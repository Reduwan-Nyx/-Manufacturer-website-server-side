const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.otvh1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


async function run(){
    try{
        await client.connect()
        const servicesCollection = client.db('cart_tool').collection('services')  
        const bookingCollection = client.db('cart_tool').collection('booking')
        const userCollection = client.db('cart_tool').collection('users')


      // user
      app.put('/user/:email', async(req, res)=>{
        const email = req.params.email;
        const user = req.body;
        const filter = {email : email};
       const options = {upsert: true};
       const updateDoc = {
         $set: user,
       };
       const result = await userCollection.updateOne(filter, updateDoc, options);
       res.send(result)
      })


  

    }
    finally{

    }
}

run().catch(console.dir)



app.get('/', (req, res) => {
  res.send('Hello World!')
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})