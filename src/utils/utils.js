exports.checkIfFieldsExist = (next, ...fields) => {
    const isNotValid = fields.some(field => !field);
    if (isNotValid) {
        next(new AppError('Please provide all fields with valid data', 400));
        return false;
    }
};
