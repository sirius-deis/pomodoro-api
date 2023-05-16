const express = require('express');
const taskController = require('../controllers/task.controllers');

const taskRouter = express.Router();

taskRouter
    .route('/')
    .get(taskController.getTasks)
    .post(taskController.addTask)
    .delete(taskController.clearTasks);

taskRouter
    .route('/:taskId')
    .patch(taskController.updateTask)
    .delete(taskController.deleteTask);

module.exports = taskRouter;
