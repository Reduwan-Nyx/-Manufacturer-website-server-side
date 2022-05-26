const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
require('dotenv').config()
const { MongoClient, ServerApiVersion, ObjectId } = require('mongodb');


const app = express();
const port = process.env.PORT || 5000;

app.use(cors())
app.use(express.json())

const uri = `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASS}@cluster0.otvh1.mongodb.net/?retryWrites=true&w=majority`;
const client = new MongoClient(uri, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


function verifyJWT(req, res, next){
  const authHeader = req.headers.authorization;
  if(!authHeader){
    return res.status(401).send({message: 'UnAuthorized Access'})
  }
  const token = authHeader.split(' ')[1];
  jwt.verify(token, process.env.ACCESS_TOKEN_SECRET, function(err, decoded){
    if(err){
      return res.status(403).send({message: 'Forbidden Access'})
    }
    req.decoded = decoded;
    next()
  })
}


async function run(){
    try{
        await client.connect()
        const servicesCollection = client.db('cart_tool').collection('services')  
        const bookingCollection = client.db('cart_tool').collection('booking')
        const userCollection = client.db('cart_tool').collection('users')
        const purchaseCollection = client.db('cart_tool').collection('purchase')
        const reviewsCollection = client.db('cart_tool').collection('reviews')

      const verifyAdmin = async(req,res, next) =>{
          const requester = req.decoded.email;
          const requesterAccount = await userCollection.findOne({email: requester})
          if(requesterAccount.role === 'admin'){
            next()
          } else{
            res.status(403).send({message: 'forbidden'})
          }
      }



      // product
      
      app.get('/services', async(req,res)=>{
        const query = {}
        const cursor = servicesCollection.find(query);
        const services = await cursor.toArray();
        res.send(services)
      })

      app.get('/services/:id', async(req, res)=>{
        const id = req.params.id;
        const query ={_id: ObjectId(id)};
        const service = await servicesCollection.findOne(query);
        res.send(service);
    })

      


        // users get
        app.get('/user', verifyJWT, async(req,res)=>{
          const users = await userCollection.find().toArray()
          res.send(users)
        })

        // admin
        app.get('/admin/:email', async(req,res)=>{
          const email = req.params.email;
          const user = await userCollection.findOne({email: email})
          const isAdmin = user.role === 'admin'
          res.send({admin : isAdmin})
        })

        // admin
        app.put('/user/admin/:email', verifyJWT, verifyAdmin, async(req, res)=>{
          const email = req.params.email;
            const filter = {email : email};
            const updateDoc = {
              $set: {role: 'admin'},
            };
            const result = await userCollection.updateOne(filter, updateDoc);
           
            res.send(result)
        
        })
  


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
       const token = jwt.sign({email: email},process.env.ACCESS_TOKEN_SECRET, {expiresIn: '1h'})
       res.send({result , token})
      })

      // purchase
      app.get('/purchase', verifyJWT,verifyAdmin, async(req,res)=>{
        const products = await purchaseCollection.find().toArray()
        res.send(products)
      })

      // purchase
      app.post('/purchase', verifyJWT, verifyAdmin, async(req, res)=>{
        const purchase = req.body;
        const reuslt = await purchaseCollection.insertOne(purchase)
        res.send(reuslt)
      })
      //product delete
      app.delete('/purchase/:email', verifyJWT, verifyAdmin, async(req, res)=>{
        const email = req.params.email;
        const fitler ={email: email}
        const reuslt = await purchaseCollection.deleteOne(fitler)
        res.send(reuslt)
      })
  

      // review
      app.get('/reviews', async(req,res)=>{
        const review = await reviewsCollection.find().toArray()
        res.send(review)
      })

        app.post('/reviews', async(req,res)=>{
          const review = req.body;
          const result = await reviewsCollection.insertOne(review)
          res.send(result)
        })
      


        // booking


        app.get('/booking', async(req, res)=>{
          const product = req.query.product;
          const query = {product: product}
          const bookings = await bookingCollection.find(query).toArray()
          res.send(bookings)
        })

        
        app.post('/booking', async(req, res)=>{
          const booking = req.body;
          const query = {booking: booking.booking, product: booking.product}
          const result = await bookingCollection.findOne(query)
          res.send(result)
        })
        








        app.post("/services", async (req, res) => {
          const newService = req.body;
          const result = await servicesCollection.insertOne(newService);
          res.send(result);
        });


        app.put('/services/:id', async(req, res)=>{
          const id = req.params.id;
          const updatedStock = req.body;
          const filter = {_id: ObjectId(id)}
          const options = {upsert: true};
   
          const updateDoc = {
              $set:{
                  quantity: updatedStock.quantity,
              },
          };
          const result = await servicesCollection.updateOne(filter,updateDoc, options);
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