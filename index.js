const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const fs = require('fs');

const { ApolloServer } = require('apollo-server-express');
const graphqlConfig = require('./graphql');
const { jwtSign, jwtVerify } = require('./graphql/authentication');

const db = require('./models');

const passport = require('passport');
const passportConfig = require('./passport');

const dotenv = require('dotenv');
const morgan = require('morgan');

const https = require('https');
const http = require('http');
// Express App Init
const app = express();
dotenv.config();

const configurations = {
	production: { ssl: true, port: 8000, hostname: 'example.com' },
	development: { ssl: false, port: 4000, hostname: 'localhost' }
};

const environment = process.env.NODE_ENV || 'production';
const config = configurations[environment];

// Apollo Server Init
const apollo = new ApolloServer({
	...graphqlConfig,
	playground: {
		settings: {
			'request.credentials': 'include'
		}
	},
	// Context object is one that gets passed to every single resolvers
	// at every level.
	context: ({ req }) => {
		let user = null;
		if (req.user) user = req.user.toJSON();
		if (!user) {
			console.log('유저가 존재하지 않습니다.');
			return { db, req };
		}
		return { db, user, req };
	}
});

// Express Environment Setting
app.use(morgan('dev'));
app.use(express.json());
// JSON형태의 본문을 처리하는 express 미들웨어
app.use(express.urlencoded({ extended: true }));
// FORM을 처리해주는 express 미들웨어
app.use(
	cors({
		origin: true,
		credentials: true
	})
);
app.use('/', express.static('public'));
app.use(cookieParser(process.env.COOKIE_SECRET));
app.use(
	expressSession({
		resave: false,
		saveUninitialized: false,
		secret: process.env.COOKIE_SECRET,
		cookie: {
			httpOnly: true,
			secure: false
		},
		name: 'sefqfzveeff'
	})
);
app.use(passport.initialize());
app.use(passport.session());

//Database Init
db.sequelize.sync();

// Express API
apollo.applyMiddleware({ app, path: '/graphql' });

// Create the HTTPS or HTTP server
// let server;
// if (config.ssl) {
// 	server = https.createServer(
// 		{
// 			key: fs.readFileSync(`./ssl/${environment}/server.key`),
// 			cert: fs.readFileSync(`./ssl/${environment}/server.crt`)
// 		},
// 		app
// 	);
// } else {
// 	server = http.createServer(app);
// }

//Starting Express App
app.listen({ port: config.port }, () => {
	console.log(
		`Apollo Server ready at http${config.ssl ? 's' : ''}://${config.hostname}:${config.port}${apollo.graphqlPath}`
	);
});
