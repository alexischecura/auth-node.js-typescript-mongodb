# Node.js Authentication with MongoDB, Redis, and Typegoose

Welcome to the the backend auth aplication with Node.js.

## Getting Started

### Prerequisites

Before you dive into using this application, make sure you have the following tools installed on your machine:

- [pnpm](https://pnpm.io/): Package manager.
- [Docker](https://www.docker.com/): For database containerization

### Installation

Follow these steps to set up the application:

1. Clone this repository to your local machine:

   ```bash
   git clone https://github.com/alexischecura/auth-node.js-typescript-mongodb.git
   ```

2. **Backend Setup:**

   - Navigate to the folder and install the required dependencies:

     ```bash
     pnpm install
     ```

   - Create a `.env` file in the backend folder and set up the necessary environment variables. You can use the provided `example.env` file as a reference.

   - Set up the Mongo Database and Redis Database using Docker:

     ```bash
     docker-compose up
     ```

   - Apply database migrations to create the required entities:

     ```bash
     pnpm migrate
     ```

   - Start the backend server:

     ```bash
     pnpm start
     ```

## Technologies Used

- Node.js
- Express
- Zod
- Typegoose
- Mongoose
- MongoDB
- Redis

Feel free to explore and contribute.

