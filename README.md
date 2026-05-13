# AI Recipe Generator

An AI-powered recipe generator application that helps users create personalized recipes based on their pantry ingredients, dietary preferences, and cooking goals. The application features a modern React frontend and a Node.js/Express backend with Google Gemini AI integration.

## Features

### Frontend (React)
- **User Authentication**: Login and signup screens with JWT-based authentication
- **Dashboard**: Overview of recipes, pantry items, and meal planning
- **Pantry Management**: Add, edit, and organize pantry ingredients
- **AI Recipe Generator**: Generate recipes based on available ingredients and preferences
- **Recipe Management**: Save, browse, and view detailed recipe information
- **Meal Planning**: Weekly meal planner with drag-and-drop functionality
- **Shopping Lists**: Automatically generated shopping lists grouped by category
- **User Settings**: Profile management and preference settings
- **Responsive Design**: Mobile-friendly interface with modern UI

### Backend (Node.js/Express)
- **RESTful API**: Complete API for user management, recipes, and pantry data
- **AI Integration**: Google Gemini AI for intelligent recipe generation
- **Database**: PostgreSQL with Neon database hosting
- **Authentication**: JWT-based secure authentication system
- **Security**: Password hashing, CORS, and input validation

## Tech Stack

### Frontend
- **React 19** - Modern React with hooks and functional components
- **Vite** - Fast build tool and development server
- **Tailwind CSS 4** - Utility-first CSS framework
- **React Router** - Client-side routing
- **Axios** - HTTP client for API calls
- **Lucide React** - Beautiful icon library
- **React Hot Toast** - Toast notifications
- **dnd-kit** - Drag and drop functionality
- **date-fns** - Date utility library

### Backend
- **Node.js** - JavaScript runtime
- **Express.js** - Web application framework
- **PostgreSQL** - Relational database
- **Google Gemini AI** - AI-powered recipe generation
- **JWT** - JSON Web Tokens for authentication
- **bcryptjs** - Password hashing
- **CORS** - Cross-origin resource sharing

## Project Structure

```
AI-RECIPE-GENERATOR/
├── backend/                    # Node.js/Express backend
│   ├── config/                 # Database configuration
│   ├── controllers/            # Route controllers
│   ├── middleware/             # Authentication middleware
│   ├── models/                 # Database models
│   ├── routes/                 # API routes
│   ├── utils/                  # Utility functions
│   ├── server.js               # Main server file
│   ├── package.json            # Backend dependencies
│   └── .env                    # Environment variables (not committed)
├── forntend/                   # React frontend
│   └── ai-recipe-generator-ui-boilerplate-code/
│       ├── public/             # Static assets
│       ├── src/
│       │   ├── components/     # Reusable UI components
│       │   ├── context/        # React context providers
│       │   ├── data/           # Dummy data for development
│       │   ├── pages/          # Application pages
│       │   ├── services/       # API service functions
│       │   ├── App.jsx         # Main app component
│       │   ├── main.jsx        # React entry point
│       │   └── index.css       # Global styles
│       ├── package.json        # Frontend dependencies
│       └── vite.config.js      # Vite configuration
├── Project_Report_Work/        # Project documentation (LaTeX)
├── tools/                      # Build and utility scripts
├── .gitignore                  # Git ignore rules
└── README.md                   # This file
```

## Installation & Setup

### Prerequisites
- Node.js (v16 or higher)
- npm or yarn
- PostgreSQL database (or Neon account for cloud database)
- Google Gemini API key

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with the following variables:
   ```env
   PORT=8000
   DATABASE_URL=your_postgresql_connection_string
   JWT_SECRET=your_jwt_secret_key
   GEMINI_API_KEY=your_google_gemini_api_key
   NODE_ENV=development
   ```

4. Set up the database:
   ```bash
   npm run migrate
   ```

5. Start the development server:
   ```bash
   npm run dev
   ```

The backend will be running on `http://localhost:8000`

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd forntend/ai-recipe-generator-ui-boilerplate-code
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the development server:
   ```bash
   npm run dev
   ```

The frontend will be running on `http://localhost:5173`

## Usage

1. **Register/Login**: Create an account or log in with existing credentials
2. **Manage Pantry**: Add your available ingredients
3. **Generate Recipes**: Use AI to create recipes based on your pantry
4. **Plan Meals**: Organize your weekly meal plan
5. **Shop Smart**: Generate shopping lists for missing ingredients

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/profile` - Get user profile

### Users
- `GET /api/users` - Get user information
- `PUT /api/users` - Update user profile

### Recipes
- `GET /api/recipes` - Get user's recipes
- `POST /api/recipes` - Create new recipe
- `GET /api/recipes/:id` - Get specific recipe
- `PUT /api/recipes/:id` - Update recipe
- `DELETE /api/recipes/:id` - Delete recipe

### Pantry
- `GET /api/pantry` - Get pantry items
- `POST /api/pantry` - Add pantry item
- `PUT /api/pantry/:id` - Update pantry item
- `DELETE /api/pantry/:id` - Delete pantry item

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the ISC License - see the LICENSE file for details.

## Acknowledgments

- Google Gemini AI for recipe generation
- React community for excellent documentation
- Open source contributors

---

**Note**: This project includes comprehensive documentation in the `Project_Report_Work/` directory with detailed SRS, system design, and testing documentation.