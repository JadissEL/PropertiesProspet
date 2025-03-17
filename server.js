require('dotenv').config();
const express = require('express');
const rateLimit = require('express-rate-limit');
const bodyParser = require('body-parser');
const cors = require('cors');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const passport = require('passport');
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const session = require('express-session');
const swaggerUi = require('swagger-ui-express');
const swaggerJsDoc = require('swagger-jsdoc');
const { sequelize, User } = require('./models');
const path = require('path');
const helmet = require('helmet');
const { csrfSync } = require('csrf');

const app = express();
const port = process.env.PORT || 3000;
const secretKey = process.env.SECRET_KEY;
const googleClientID = process.env.GOOGLE_CLIENT_ID;
const googleClientSecret = process.env.GOOGLE_CLIENT_SECRET;

// Middleware
app.use(bodyParser.json());
app.use(cors());
app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    hsts: { maxAge: 31536000, includeSubDomains: true }
}));

const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100
});
app.use(limiter);

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: true,
    cookie: {
        secure: process.env.NODE_ENV === 'production',
        httpOnly: true,
        sameSite: 'lax'
    }
}));

const csrfProtection = csrfSync({
    cookie: {
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production'
    }
});
app.use(csrfProtection);
app.use((req, res, next) => {
    res.locals.csrfToken = req.csrfToken();
    next();
});

app.use(passport.initialize());
app.use(passport.session());

// Serve static files
app.use(express.static(path.join(__dirname)));

// Passport configuration
passport.use(new GoogleStrategy({
    clientID: googleClientID,
    clientSecret: googleClientSecret,
    callbackURL: '/auth/google/callback'
}, async (accessToken, refreshToken, profile, done) => {
    const { id, displayName, emails } = profile;
    const email = emails[0].value;
    let user = await User.findOne({ where: { email } });
    if (!user) {
        user = await User.create({ firstName: displayName, lastName: '', email, password: '' });
    }
    done(null, user);
}));

passport.serializeUser((user, done) => {
    done(null, user.id);
});

passport.deserializeUser(async (id, done) => {
    const user = await User.findByPk(id);
    done(null, user);
});

function authenticateToken(req, res, next) {
    const token = req.headers['authorization'] && req.headers['authorization'].split(' ')[1];
    if (!token) return res.sendStatus(401);

    jwt.verify(token, secretKey, (err, user) => {
        if (err) return res.sendStatus(403);
        req.user = user;
        next();
    });
}

// Serve landing page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Google OAuth routes
app.get('/auth/google', passport.authenticate('google', { scope: ['profile', 'email'] }));

app.get('/auth/google/callback', passport.authenticate('google', { failureRedirect: '/login' }), (req, res) => {
    const token = jwt.sign({ userId: req.user.id }, secretKey, { expiresIn: '1h' });
    res.redirect(`/dashboard.html?token=${token}`);
});

// Routes
const prospectRoutes = require('./routes/prospectRoutes');
app.use('/api/prospects', prospectRoutes);

app.post('/api/register', async (req, res) => {
    const { firstName, email, password } = req.body;
    if (!firstName || !email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    try {
        const user = await User.create({ firstName, lastName: '', email, password: hashedPassword });
        const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
        res.status(201).json({ token });
    } catch (error) {
        res.status(400).json({ error: 'Email already exists' });
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(400).json({ error: 'All fields are required' });
    }
    const user = await User.findOne({ where: { email } });
    if (user && await bcrypt.compare(password, user.password)) {
        const token = jwt.sign({ userId: user.id }, secretKey, { expiresIn: '1h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid email or password' });
    }
});

const swaggerOptions = {
    swaggerDefinition: {
        info: {
            title: 'Property Prospects Manager API',
            description: 'API documentation for Property Prospects Manager',
            version: '1.0.0'
        }
    },
    apis: ['./routes/*.js']
};

const swaggerDocs = swaggerJsDoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

sequelize.sync().then(() => {
    app.listen(port, () => {
        console.log(`Server is running on port ${port}`);
    });
});
