# Closer - A Social Media App (MERN)

Closer is a full-stack social media application built using the MERN stack (MongoDB, Express.js, React.js, and Node.js). It provides users with a platform to connect, share posts, and interact with each other.

## Features
- User Authentication (Sign up, Login, Logout)
- Profile Management
- Post Creation, Editing, and Deletion
- Like and Comment on Posts
- Follow and Unfollow Users
- Real-time Notifications
- Secure Backend with JWT Authentication
- Responsive UI

## Tech Stack
- **Frontend:** React.js, Redux, Tailwind CSS
- **Backend:** Node.js, Express.js
- **Database:** MongoDB (Mongoose ORM)
- **Authentication:** JWT (JSON Web Tokens)
- **Deployment:** Vercel (Frontend), Render/Heroku (Backend)

## Installation
### Prerequisites
Ensure you have the following installed:
- Node.js
- MongoDB (Locally or using MongoDB Atlas)

### Clone the Repository
```sh
git clone https://github.com/Prajualit/Social-Media-App-Closer-Mern.git
cd Social-Media-App-Closer-Mern
```


### Backend Setup
1. Navigate to the `backend` directory:
   ```sh
   cd backend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Create a `.env` file and add the following environment variables:
   ```env
   MONGO_URI=your_mongodb_connection_string
   JWT_SECRET=your_secret_key
   ```
4. Start the backend server:
   ```sh
   npm start
   ```
   The backend will run on `http://localhost:5000`.

### Frontend Setup
1. Navigate to the `frontend` directory:
   ```sh
   cd frontend
   ```
2. Install dependencies:
   ```sh
   npm install
   ```
3. Start the frontend:
   ```sh
   npm run dev
   ```
   The frontend will run on `http://localhost:3000`.

## Usage
1. Register a new user or log in with an existing account.
2. Create and share posts.
3. Interact with other users by liking and commenting on posts.
4. Follow users to see their updates in your feed.

## Contributing
Feel free to submit issues or pull requests to improve the project. To contribute:
1. Fork the repository.
2. Create a new branch (`git checkout -b feature-branch`).
3. Commit your changes (`git commit -m "Added a new feature"`).
4. Push the branch (`git push origin feature-branch`).
5. Create a pull request.

## License
This project is open-source and available under the [MIT License](LICENSE).

## Contact
For any questions or suggestions, feel free to contact me via:
- GitHub: [Prajualit Tickoo](https://github.com/Prajualit)
- Email: your-email@example.com
