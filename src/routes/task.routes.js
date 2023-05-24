const express = require('express');
const taskController = require('../controllers/task.controllers');
const {
    isInLength,
    isBoolean,
    isNumberInRange,
} = require('../middlewares/validation.middleware');

const taskRouter = express.Router();

taskRouter
    .route('/')
    .get(taskController.getTasks)
    .post(
        isInLength('title', 5, 256),
        isBoolean('isDone'),
        isNumberInRange('times'),
        isNumberInRange('timesDone'),
        isInLength('note', 0),
        taskController.addTask
    )
    .delete(taskController.clearTasks);

taskRouter
    .route('/:taskId')
    .patch(taskController.updateTask)
    .delete(taskController.deleteTask);

module.exports = taskRouter;
