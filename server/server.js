if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}
require('./db/connect')
const express = require('express')
const app = express()
const questionRoutes = require('./routes/questionRoutes');
const answerRoutes = require('./routes/answerRoutes');
const path = require('path');
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy;
const flash = require('express-flash')
const bodyParser = require("body-parser")
const expressSession = require('express-session')
const methodOverride = require('method-override')
const authRoutes = require('./routes/authRoutes')
const cors = require('cors');
const bcrypt = require('bcrypt')
const User = require('./models/models').User
const Question = require('./models/models').Question
const Answer = require('./models/models').Answer
const jwt = require('jsonwebtoken')



const port = (process.env.PORT || 4000)

const start = async () =>{
    try{
        await app.listen(port, console.log(`server is listening on port ${port}...`))
    } catch (error) {
        console.log(error)
    }
}

const allowedOrigins = ['http://localhost:3000'];

const corsOptions = {
  origin: (origin, callback) => {
    if (allowedOrigins.indexOf(origin) !== -1 || !origin) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
};

app.use(cors(corsOptions));

app.set('view engine', 'ejs');
app.set('views' , path.join(__dirname, 'views'));
app.use(express.urlencoded({ extended: false }))
app.use(flash())
app.use(expressSession({
  secret: "hi",
  resave: false, 
  saveUninitialized: false
}))
app.use(methodOverride('_method'))
app.use(express.json());
app.use(cors());
app.use(passport.initialize());
app.use(passport.session());

passport.serializeUser((user, cb) => {
  cb(null, user.id);
});

passport.deserializeUser((id, cb) => {
  User.findOne({_id: id}, (err, user) => {
    cb(err, user);
  });
});

passport.use(new LocalStrategy(
  { usernameField: 'email' },
  async (email, password, done) => {
    try {
      const user = await User.findOne({ email });

      if (!user) {
        return done(null, false, { message: 'No user with that email' });
      }

      const match = await bcrypt.compare(password, user.password);

      if (match) {
        return done(null, user);
      } else {
        return done(null, false, { message: 'Password incorrect' });
      }
    } catch (error) {
      return done(error);
    }
  }
));






function checkAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next()
  }

}


app.post('/login', (req, res, next) => {
  passport.authenticate('local', (err, user, info) => {
    if (err) {
      return next(err);
    }
    if (!user) {
      return res.status(401).json({ message: 'Authentication failed' });
    }
    req.logIn(user, (err) => {
      if (err) {
        return next(err);
      }
      return res.status(200).json({user: user});
      console.log(req.user)
    });
  })(req, res, next);
});



app.post('/register', async (req, res,) =>{
    try {
        const hashedPassword = await bcrypt.hash(req.body.password, 10)
        const newUser = new User({
            name: req.body.name,
            email:req.body.email,
            password:hashedPassword,
        })
        await newUser.save();
        console.log('user registered')
        res.status(200).json({ message: 'Registration Successful' })
    } catch {
      res.status(400).json({ message: 'Registration failed', error: error.message });
    }
  })

  
app.get('/logout', (req, res) => {
  req.logout((err) => {
    if (err) {
      console.error(err);
    }
    res.redirect('/login');
  });
});

app.get('/profile', checkAuthenticated,(req, res) => {
  if (req.isAuthenticated()) {
      res.send({
        user
    });
  } else {
    // If not authenticated, send an error response
    res.status(401).json({ error: 'Unauthorized' });
  }
});




// Get questions by category
app.get('/questions/:category', async (req, res) => {
  try {
    const category = req.params.category;
    const questions = await Question.find({ category });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a new question
app.post('/questions/:category', async (req, res) => {
  try {
    const { title, content, category, user } = req.body;
    const newQuestion = new Question({ title, content, category, user });
    const savedQuestion = await newQuestion.save();
    res.json(savedQuestion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Get question details by ID with answers
app.get('/questions/:category/:questionId', async (req, res) => {
  try {
    const question = await Question
      .findById(req.params.questionId)
      .populate('answers'); // Populate answers
    res.json(question);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Create a new answer
app.post('/questions/:category/:questionId', async (req, res) => {
  try {
    const { content, questionId, category, user } = req.body;

    const newAnswer = new Answer({ content, category, questionId, user });
    const savedAnswer = await newAnswer.save();

    // Update the corresponding question's answers array
    const updatedQuestion = await Question
      .findByIdAndUpdate(
        questionId,
        { $push: { answers: savedAnswer._id } },
        { new: true }
      )
      .populate('answers'); // Populate answers

    res.json(updatedQuestion);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});



// Get answers for a specific question by question ID
app.get('/questions/:questionId/answers', async (req, res) => {
  try {
    const questionId = req.params.questionId;
    const answers = await Answer.find({ questionId: mongoose.Types.ObjectId(questionId) });
    console.log('Answers:', answers);
    res.json(answers);
  } catch (error) {
    console.error('Error fetching answers:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});



start()

