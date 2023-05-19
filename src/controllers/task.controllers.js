const catchAsync = require('../utils/catchAsync');
const AppError = require('../utils/appError');

const Task = require('../models/task.models');

const updateField = (entity, name, value) => {
    if (value && entity[name] !== value) {
        entity[name] = value;
    }
};

exports.getTasks = catchAsync(async (req, res) => {
    const { id } = req.user;
    const tasks = await Task.find({ userId: id }).select('-__v');

    res.status(200).json({
        message: 'Tasks were retrieved successfully',
        data: { tasks },
    });
});

exports.addTask = catchAsync(async (req, res) => {
    const { id } = req.user;
    const { title, isDone, times, timesDone, note } = req.body;
    if (title.trim().length < 7) {
        return next(
            new AppError(
                "Title can't be empty. Please provide valid title for your task",
                400
            )
        );
    }
    if (times <= 0 || timesDone < 0) {
        return next(
            new AppError(
                "Neither times, nor times done can't be a number which less than 1",
                400
            )
        );
    }
    await Task.create({ title, isDone, times, timesDone, note, userId: id });

    res.status(201).json({
        message: 'Task was created successfully',
    });
});

exports.clearTasks = catchAsync(async (req, res) => {
    const { id } = req.user;
    await Task.deleteMany({ userId: id });

    res.status(204).json({ message: 'All your tasks were completely deleted' });
});

exports.updateTask = catchAsync(async (req, res) => {
    const { taskId } = req.params;
    const { title, isDone, times, timesDone, note } = req.body;
    if (!title && !isDone && !times && !timesDone && !note) {
        return next(
            new AppError(
                'You need provide at least one field which should be changed',
                404
            )
        );
    }
    const task = await Task.findById(taskId);
    if (!task) {
        return next(new AppError('There is no such task', 404));
    }
    updateField(task, 'title', title);
    updateField(task, 'isDone', isDone);
    updateField(task, 'times', times);
    updateField(task, 'timesDone', timesDone);
    updateField(task, 'note', note);

    await task.save();
    res.status(201).json({
        message: 'Task was updated successfully',
    });
});

exports.deleteTask = catchAsync(async (req, res) => {
    const { taskId } = req.params;
    const task = await Task.findById(taskId);
    if (!task) {
        return next(new AppError('There is no such task', 404));
    }

    await task.deleteOne();

    res.status(204).json({
        message: 'Task was deleted successfully',
    });
});
