const express = require('express')
const path = require('path')
const mongoose = require('mongoose')
const User = require('./model/user')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

const JWT_SECRET = "kjsodjf9werofjw3oirjoiwejfoij jsdoifjwoijefo"

mongoose.connect('mongodb://127.0.0.1:27017/test', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
    useCreateIndex: true,
    auth: { authSource: 'admin' },
    user: 'root',
    pass: '000000'
})
mongoose.connection.on("connected", () => {
    console.log("Connected successfully!");
})
mongoose.connection.on('error', err => {
    console.log('Connection failed with error: ', err);
})

const app = express()
app.use('/', express.static(path.join(__dirname, 'static')))
app.use(express.json())

app.post('/api/register', async (req, res) => {
    const { username, password } = req.body

    const newPassword = await bcrypt.hash(password, 10)

    try {
        const res = await User.create({
            username,
            password: newPassword
        })
        res.json({ msg: 'User inserted'})
    } catch (err) {
        res.status(500).json('Failed to inserted with error: ' + err)
    }
})

app.post('/api/change-password', async (req, res) => {
    const { newPassword: plainTextPassword } = req.body
    const bearerHeader = req.headers['authorization']

    if (typeof bearerHeader !== undefined) {
        const bearer = bearerHeader.split(' ')
        const bearerToken = bearer[1]
        req.token = bearerToken
    }

    try {
        const user = jwt.verify(req.token, JWT_SECRET)

        const _id = user.id

        const password = await bcrypt.hash(plainTextPassword, 10)

        await User.updateOne({ _id }, {
            $set: { password }
        })

        res.json({ status: 'ok' })

    } catch (err) {
        res.status(500).json({ status: 'error', error: 'Error: ' + err})
    }
})

app.post('/api/login', async (req, res) => {
    const { username, password } = req.body

    const user = await User.findOne({ username }).lean()

    if (!user) {
        res.json({ status: 'error', error: 'Invalid username/password'})
    }

    if (await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({
            id: user._id,
            username: user.username
        }, JWT_SECRET)
        return res.json({ status: 'ok', data: token})
    }

    res.json({ status: 'error', error: 'Invalid username/password'})
})

app.listen(3000, () => {
    console.log('Server is listening at port 3000...');
})