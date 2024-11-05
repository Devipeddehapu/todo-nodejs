const express = require('express')
const app = express()

const {open} = require('sqlite')
const sqlite3 = require('sqlite3')

const path = require('path')
const dbpath = path.join(__dirname, 'todoApplication.db')
let db = null

const intializeDbAndServer = async () => {
  try {
    db = await open({
      filename: dbpath,
      driver: sqlite3.Database,
    })
    app.listen(3000, () => {
      console.log('Server Running at http://localhost:3000/')
    })
  } catch (error) {
    console.log('DB Server :`${error.message}`')
  }
}

intializeDbAndServer()

const hasPriorityAndStatusProperties = requestQuery => {
  return (
    requestQuery.priority !== undefined && requestQuery.status !== undefined
  )
}

const hasPriorityProperty = requestQuery => {
  return requestQuery.priority !== undefined
}

const hasStatusProperty = requestQuery => {
  return requestQuery.status !== undefined
}

app.get('/todos/', async (request, response) => {
  let data = null
  let getTodosQuery = ''

  const {search_q = '', priority, status} = request.query
  switch (true) {
    case hasPriorityAndStatusProperties(request.query):
      getTodosQuery = ` 
        SELECT * from todo WHERE todo like '%${search_q}%'
        AND status = '${status}' 
        AND priority = '${priority}' ;`

      break
    case hasPriorityProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND priority = '${priority}';`
      break

    case hasStatusProperty(request.query):
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%'
    AND status = '${status}';`
      break
    default:
      getTodosQuery = `
   SELECT
    *
   FROM
    todo 
   WHERE
    todo LIKE '%${search_q}%';`
  }

  data = await db.all(getTodosQuery)
  response.send(data)
})

//api2 get specific id todo

app.get('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  getASpecificTodoQuery = `
    select * from todo where id = ${todoId} ;`
  const getASpecificTodoResponse = await db.get(getASpecificTodoQuery)
  response.send(getASpecificTodoResponse)
})

//api3 post a todo item

app.post('/todos/', async (request, response) => {
  const {id, todo, priority, status} = request.body

  const postTodoQuery = `
       INSERT INTO 
       todo (id, todo, priority, status)
       VALUES (${id}, '${todo}', '${priority}', '${status}');`
  await db.run(postTodoQuery)
  response.send('Todo Successfully Added')
})

//api4 Updates the details of a specific todo
app.put('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  let updatedColumn = ''
  const requestBody = request.body
  switch (true) {
    case requestBody.status !== undefined:
      updatedColumn = 'Status'
      break
    case requestBody.priority !== undefined:
      updatedColumn = 'Priority'
      break
    case requestBody.todo !== undefined:
      updatedColumn = 'Todo'
      break
  }
  const previousTodoQuery = `
  select  * from todo where id = ${todoId};`

  const previousTodo = await db.get(previousTodoQuery)

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
  } = request.body
  const updateTodoQuery = `
       UPDATE 
       todo 
       SET 
         todo = '${todo}',
         priority = '${priority}',
         status = '${status}' 
       WHERE id = ${todoId};`
  await db.run(updateTodoQuery)
  response.send(`${updatedColumn} Updated`)
})

//api5 Deletes a todo from the todo
app.delete('/todos/:todoId/', async (request, response) => {
  const {todoId} = request.params
  const deleteQuery = `
  Delete from todo where id = ${todoId} ;`
  await db.run(deleteQuery)
  response.send('Todo Deleted')
})

module.exports = app
