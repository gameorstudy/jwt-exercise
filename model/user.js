const mongoose = require('mongoose')

const UserSchema = new mongoose.Schema({
    username: { type: String, require: true, unique: true },
    password: { type: String, required: true } 
})

const model = mongoose.model('User', UserSchema)

module.exports = model