require('dotenv').config(".env") 
const express = require("express")
const morgan = require("morgan")
const cors = require("cors")
const Person = require('./models/person')

const app = express()
morgan.token("exercise",function (req,res){return JSON.stringify(req.body)})
app.use(cors())
app.use(express.static('build'))//Load the static frontend page
app.use(express.json())
app.use(morgan(":method :url :status :res[content-length] - :response-time ms :exercise"))

app.set('view engine', 'pug')

app.get('/info', (request, response) => {
    Person.countDocuments()
    .then(count=>response.render('index', { title: 'Phonebook info', personsNumber: count, date: Date().toLocaleString() }))
    .catch(error=>next(error))
})

app.get('/api/persons', (request, response,next) => {
    Person.find({}).then(persons => {
        response.json(persons)
    }).catch(error=>next(error))
})

app.get('/api/persons/:id', (request, response,next) => {
    Person.findById(request.params.id).then(person => {
        response.json(person)
    }).catch(error=>next(error))
})

app.delete('/api/persons/:id', (request, response) => {
    Person.findByIdAndDelete(request.params.id)
    .then(response.status(204).end())
    .catch(error=>next(error))
})

app.post('/api/persons', (request, response, next) => {
    const body = request.body

    if (!body.name) {
        return response.status(400).json({
            error: 'name is missing'
        })
    }
    if (!body.number) {
        return response.status(400).json({
            error: 'number is missing'
        })
    }

    const person = new Person({
        name: body.name,
        number: body.number,
    })

    person.save()
    .then(savedPerson => {
        response.json(savedPerson)
    })
    .catch(error=> {
        next(error)
        console.log(error.response)
    })
})

app.put('/api/persons/:id', (request, response, next) => {
    const body = request.body

    const person = {
        number: body.number
    }

    Person.findByIdAndUpdate(request.params.id, person, { new: true, runValidators: true  })
        .then(updatedPerson => {
            response.json(updatedPerson)
        })
        .catch(error => next(error))
})

const errorHandler = (error, request, response, next) => { 
    console.error(error.message)
    if (error.name === 'CastError') { 
        return response.status(400).send({ error: 'wrong id' })
    }
    else if (error.name === 'ValidationError') {
        return response.status(400).json({ error: error.message })
      }
    else    {
        return response.status(500).end()
    }
}
app.use(errorHandler) //Por alguna razon esto debe ir AL FINAL de todo el codigo

const PORT = process.env.PORT || 3001
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
})