const mongoose = require('mongoose');

const TaskSchema = new mongoose.Schema({
    title: {
        type: String,
        required: [true, "This field can't be empty"],
        min: [10, 'Task title should be at least 10 character long'],
    },
    isDone: {
        type: Boolean,
        required: true,
    },
    times: {
        type: Number,
        required: true,
        min: [1, "This field can't be neither 0, nor negative number"],
    },
    timersDone: {
        type: Number,
        required: true,
        validate: {
            validator: function (value) {
                return this.time < value;
            },
            message: "Times of done can't be more then times itself",
        },
    },
    note: {
        type: String,
    },
});

const Task = mongoose.model('task', TaskSchema);

module.exports = Task;
